#!/usr/bin/env python3
"""Optional, explicit cartographic field generalization; never changes the source.

Only use for broad spatial patterns. This produces a derived field, not exact
point temperatures. Null centers stay null. Rendering lines and bands from this
same derived grid keeps their boundaries consistent.
"""
import argparse
import copy
import hashlib
import json
import math
from pathlib import Path

EARTH_KM = 6371.0088

def generalize(grid, sigma_km):
    if not math.isfinite(sigma_km) or not 1 <= sigma_km <= 100:
        raise ValueError('sigma-km must be explicit, finite, and within1..100')
    if grid.get('schema') != 'vectora.scalar-grid/v1' or grid.get('crs') != 'EPSG:4326':
        raise ValueError('Requires an explicit geographic scalar node grid')
    xs, ys, values = grid['longitudes'], grid['latitudes'], grid['values']
    if not 2 <= len(xs) or not 2 <= len(ys) or len(xs)*len(ys)>50000:
        raise ValueError('Requires2x2..50000 nodes')
    if any(not math.isfinite(x) or abs(x)>180 for x in xs) or any(not math.isfinite(y) or abs(y)>80 for y in ys):
        raise ValueError('Regional nonpolar grids only')
    if any(b<=a for a,b in zip(xs,xs[1:])) or xs[-1]-xs[0]>60:
        raise ValueError('Regional ascending longitudes; antimeridian grids unsupported')
    sign=1 if grid.get('rowOrder')=='south-to-north' else -1 if grid.get('rowOrder')=='north-to-south' else 0
    if not sign or any((b-a)*sign<=0 for a,b in zip(ys,ys[1:])):
        raise ValueError('Latitude order must agree with rowOrder')
    if len(values)!=len(ys) or any(len(row)!=len(xs) or any(v is not None and (isinstance(v,bool) or not isinstance(v,(int,float)) or not math.isfinite(v)) for v in row) for row in values):
        raise ValueError('Dense finite values or explicit nulls required')
    # Regular geographic pixels are required so cos(latitude) represents area.
    for coords in (xs,ys):
        step=coords[1]-coords[0]
        if any(abs((b-a)-step)>max(1e-9,abs(step)*1e-7) for a,b in zip(coords,coords[1:])):
            raise ValueError('Regular grid required for area-weighted neighborhood')
    radius=3*sigma_km
    dy=abs(ys[1]-ys[0]);dx=xs[1]-xs[0]
    ry=math.ceil(math.degrees(radius/EARTH_KM)/dy)
    radians=[math.radians(y) for y in ys]
    cosines=[math.cos(y) for y in radians]
    estimated_work=sum(sum(v is not None for v in values[r])*
        min(len(xs),2*math.ceil(math.degrees(radius/(EARTH_KM*cosines[r]))/dx)+1)*
        (min(len(ys),r+ry+1)-max(0,r-ry)) for r in range(len(ys)))
    if estimated_work>10_000_000:
        raise ValueError('Neighborhood exceeds10,000,000 checks; crop first or use an appropriate GIS workflow')
    result=copy.deepcopy(grid); derived=[];deltas=[];support=[]
    for r,lat in enumerate(radians):
        row=[]
        rx=math.ceil(math.degrees(radius/(EARTH_KM*cosines[r]))/dx)
        for c,base in enumerate(values[r]):
            if base is None:row.append(None);continue
            numerator=denominator=0.;count=0
            for rr in range(max(0,r-ry),min(len(ys),r+ry+1)):
                a_lat=math.sin((radians[rr]-lat)/2)**2
                for cc in range(max(0,c-rx),min(len(xs),c+rx+1)):
                    value=values[rr][cc]
                    if value is None:continue
                    a=a_lat+cosines[r]*cosines[rr]*math.sin(math.radians(xs[cc]-xs[c])/2)**2
                    distance=2*EARTH_KM*math.asin(math.sqrt(min(1.,max(0.,a))))
                    if distance>radius:continue
                    weight=math.exp(-.5*(distance/sigma_km)**2)*cosines[rr]
                    numerator+=weight*value;denominator+=weight;count+=1
            value=numerator/denominator
            row.append(value);deltas.append(abs(value-base));support.append(count)
        derived.append(row)
    result['values']=derived
    result['id']=(grid['id'][:160]+f'-generalized-{sigma_km:g}km')
    original_reference=grid['provenance']['reference']
    result['provenance']['reference']=original_reference+f'; derived display field: Gaussian area-weighted valid-land neighborhood, sigma={sigma_km:g}km, cutoff=3sigma; original null centers retained; not exact point measurements'
    if len(result['provenance']['reference'])>2000:raise ValueError('Source reference plus transformation exceeds native provenance limit')
    sorted_delta=sorted(deltas)
    summary={'method':'area-weighted Gaussian neighborhood on valid source nodes','sigmaKm':sigma_km,'cutoffKm':radius,
      'coordinatesAndNodeSpacingUnchanged':True,'originalNullCentersPreserved':True,'sourceValuesMutated':False,
      'boundedNeighborCheckEstimate':estimated_work,
      'interpolatedMissingValues':0,'nodeCount':len(xs)*len(ys),'validNodes':len(deltas),
      'absoluteChange':{'mean':sum(deltas)/len(deltas) if deltas else 0,'p95':sorted_delta[min(len(sorted_delta)-1,int(.95*len(sorted_delta)))] if deltas else 0,'max':max(deltas,default=0)},
      'validNeighborhoodSamples':{'min':min(support,default=0),'max':max(support,default=0)},
      'interpretation':'Derived generalized distribution only. Raw coordinate spacing is not effective spatial resolution. Do not use for exact local temperature or small extrema questions.'}
    return result,summary

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source',type=Path);parser.add_argument('output',type=Path)
    parser.add_argument('--sigma-km',type=float,required=True)
    args=parser.parse_args();source=args.source.resolve();output=args.output.resolve();report=output.with_suffix('.generalization.json')
    if source==output or output.exists() or report.exists():raise SystemExit('Refusing source overwrite or existing output')
    data=source.read_bytes();result,evidence=generalize(json.loads(data),args.sigma_km)
    output.parent.mkdir(parents=True,exist_ok=True)
    encoded=(json.dumps(result,ensure_ascii=False,indent=2,allow_nan=False)+'\n').encode()
    evidence.update({'sourcePath':str(source),'sourceSHA256':hashlib.sha256(data).hexdigest(),'outputPath':str(output),'outputSHA256':hashlib.sha256(encoded).hexdigest()})
    with output.open('xb') as f:f.write(encoded)
    with report.open('x') as f:f.write(json.dumps(evidence,ensure_ascii=False,indent=2)+'\n')
    assert source.read_bytes()==data
    print(json.dumps(evidence,ensure_ascii=False))

if __name__=='__main__':main()
