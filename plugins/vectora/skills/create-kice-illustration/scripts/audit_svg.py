#!/usr/bin/env python3
"""Audit live SVG text against explicitly identified UND v3.0 and v3.1 faces."""
import argparse
import os
import base64
import binascii
import json
import sys
import unicodedata
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'vendor' / 'python'))
import xml.etree.ElementTree as ET

from fontTools.ttLib import TTFont

FAMILIES = {
    "UND v3.0": "main",
    "UND v3.0 Batang": "batang",
    "UND v3.1": "main31",
    "UND v3.1 Batang": "batang31",
}
FACES = {
    ("main", "regular"): (("UND-v3.0-Regular.otf",), "UNDv30-Regular", "Regular"),
    ("main", "bold"): (("UND-v3.0-Bold.otf",), "UNDv30-Bold", "Bold"),
    ("main", "italic"): (("UND-v3.0-Italic.otf",), "UNDv30-Italic", "Italic"),
    ("main", "bold-italic"): (("UNDv30-BoldItalic.otf",), "UNDv30-BoldItalic", "Bold Italic"),
    ("batang", "regular"): (("UNDv30Batang-Regular.otf",), "UNDv30Batang-Regular", "Regular"),
    ("batang", "bold"): (("UNDv30Batang-Bold.otf",), "UNDv30Batang-Bold", "Bold"),
    ("batang", "italic"): (("UNDv30Batang-Italic.otf",), "UNDv30Batang-Italic", "Italic"),
    ("batang", "bold-italic"): (("UNDv30Batang-BoldItalic.otf",), "UNDv30Batang-BoldItalic", "Bold Italic"),
    # Confirmed v3.1 TTF search names; explicit paths still require exact name-table identity.
    ("main31", "regular"): (("UNDv31-Regular.ttf",), "UNDv31-Regular", "Regular"),
    ("main31", "bold"): (("UNDv31-Bold.ttf",), "UNDv31-Bold", "Bold"),
    ("main31", "italic"): (("UNDv31-Italic.ttf",), "UNDv31-Italic", "Italic"),
    ("main31", "bold-italic"): (("UNDv31-BoldItalic.ttf",), "UNDv31-BoldItalic", "Bold Italic"),
    ("batang31", "regular"): ((), "UNDv31Batang-Regular", "Regular"),
    ("batang31", "bold"): ((), "UNDv31Batang-Bold", "Bold"),
    ("batang31", "italic"): ((), "UNDv31Batang-Italic", "Italic"),
    ("batang31", "bold-italic"): ((), "UNDv31Batang-BoldItalic", "Bold Italic"),
}
FACE_EXTENSIONS = {"main31": ".ttf"}
FACE_FILE_STEMS = {
    ("batang31", "regular"): "UNDv31Batang-Regular",
    ("batang31", "bold"): "UNDv31Batang-Bold",
    ("batang31", "italic"): "UNDv31Batang-Italic",
    ("batang31", "bold-italic"): "UNDv31Batang-BoldItalic",
}
FAMILY_VERSIONS = {
    "UND v3.0": "UND v3.0",
    "UND v3.0 Batang": "UND v3.0",
    "UND v3.1": "UND v3.1",
    "UND v3.1 Batang": "UND v3.1",
}


class AmbiguousFontPathError(ValueError):
    """Raised when extension-agnostic face discovery finds multiple candidates."""


def _face_key(style):
    weight = style.get("font-weight", "normal").strip().lower()
    italic = style.get("font-style", "normal").strip().lower() in {"italic", "oblique"}
    bold = weight in {"bold", "bolder", "600", "700", "800", "900"}
    if bold and italic:
        return "bold-italic"
    if bold:
        return "bold"
    if italic:
        return "italic"
    if weight not in {"normal", "400", "500"}:
        return "unsupported"
    return "regular"


def _primary_family(value):
    value = value.split(",", 1)[0].strip().strip("\"'")
    return unicodedata.normalize("NFC", value)


def _family_key(value):
    return FAMILIES.get(_primary_family(value))


def _provided_paths(args):
    return {
        ("main", "regular"): args.font,
        ("main", "bold"): args.bold_font,
        ("main", "italic"): args.italic_font,
        ("main", "bold-italic"): args.bold_italic_font,
        ("batang", "regular"): args.batang_font,
        ("batang", "bold"): args.batang_bold_font,
        ("batang", "italic"): args.batang_italic_font,
        ("batang", "bold-italic"): args.batang_bold_italic_font,
        ("main31", "regular"): getattr(args, "v31_font", None),
        ("main31", "bold"): getattr(args, "v31_bold_font", None),
        ("main31", "italic"): getattr(args, "v31_italic_font", None),
        ("main31", "bold-italic"): getattr(args, "v31_bold_italic_font", None),
        ("batang31", "regular"): getattr(args, "v31_batang_font", None),
        ("batang31", "bold"): getattr(args, "v31_batang_bold_font", None),
        ("batang31", "italic"): getattr(args, "v31_batang_italic_font", None),
        ("batang31", "bold-italic"): getattr(args, "v31_batang_bold_italic_font", None),
    }


def _resolve_path(face, provided, anchors):
    explicit = provided.get(face)
    if explicit:
        return explicit if explicit.is_file() else None

    if face in FACE_FILE_STEMS:
        stems = (FACE_FILE_STEMS[face],)
        filenames = ()
    else:
        extension = FACE_EXTENSIONS.get(face[0], ".otf")
        filenames = tuple(dict.fromkeys((*FACES[face][0], FACES[face][1] + extension)))
        stems = ()
    roots = []
    anchor = provided.get((face[0], "regular"))
    if anchor:
        roots.append(anchor.parent)
    # Explicit files for either version can anchor a shared font directory.
    # The per-face filename allowlist below keeps discovery version-specific.
    roots.extend(path.parent for path in provided.values() if path)
    roots.extend(anchors)
    seen = set()
    for root in roots:
        root = root.expanduser()
        if root not in seen:
            seen.add(root)
            if stems:
                try:
                    candidates = sorted(
                        candidate for candidate in root.iterdir()
                        if candidate.is_file() and candidate.stem in stems
                    )
                except OSError:
                    continue
                if len(candidates) > 1:
                    family = next((name for name, key in FAMILIES.items() if key == face[0]), face[0])
                    paths = ", ".join(candidate.name for candidate in candidates)
                    raise AmbiguousFontPathError(
                        f"Ambiguous font face file for {family} {face[1]}: {paths}"
                    )
                if candidates:
                    return candidates[0]
                continue
            for filename in filenames:
                candidate = root / filename
                if candidate.is_file():
                    return candidate
    return None


def audit(path, args, require_pure_vector=False):
    root = ET.parse(path).getroot()
    issues = []
    runs = []
    raster = 0
    used_files = {}
    loaded_fonts = {}

    provided = _provided_paths(args)
    anchors = [
        Path.home() / "Library" / "Fonts",
        Path.home() / "AppData" / "Local" / "Microsoft" / "Windows" / "Fonts",
        Path(os.environ.get("WINDIR", "C:/Windows")) / "Fonts",
        Path("/usr/share/fonts"),
        Path("/usr/local/share/fonts"),
    ]

    def record_run(value, style):
        if not value.strip():
            return
        family = _primary_family(style.get("font-family", ""))
        family_key = _family_key(family)
        if family_key is None:
            issues.append("Unsupported or missing font family: " + family + " — " + value[:35])
            return
        face_style = _face_key(style)
        face = (family_key, face_style)
        if face_style == "unsupported":
            issues.append("Unsupported font weight: " + style.get("font-weight", "") + " — " + value[:35])
            return
        if face not in FACES:
            issues.append("Unsupported font face: " + family + " " + face_style + " — " + value[:35])
            return
        try:
            font_path = _resolve_path(face, provided, anchors)
        except AmbiguousFontPathError as exc:
            issues.append(str(exc))
            return
        if font_path is None:
            issues.append("Font face file unavailable: " + family + " " + face_style)
            return
        if face not in loaded_fonts:
            try:
                loaded = TTFont(font_path)
                names = loaded["name"]
                actual_ps = names.getDebugName(6)
                expected_ps = FACES[face][1]
                if actual_ps != expected_ps:
                    issues.append(f"Wrong PostScript face for {family} {face_style}: {actual_ps}")
                actual_family = names.getDebugName(16) or names.getDebugName(1)
                if actual_family != family:
                    issues.append(f"Wrong family name for {family} {face_style}: {actual_family}")
                actual_style = names.getDebugName(17) or names.getDebugName(2)
                expected_style = FACES[face][2]
                if actual_style != expected_style:
                    issues.append(f"Wrong subfamily style for {family} {face_style}: {actual_style}")
                loaded_fonts[face] = loaded
                used_files[face] = str(font_path)
            except Exception as exc:
                issues.append(f"Cannot read font face {font_path}: {exc}")
                loaded_fonts[face] = None
        font = loaded_fonts[face]
        if font is not None:
            runs.append((value, family, font, font_path))

    def walk(element, inherited):
        nonlocal raster
        tag = element.tag.split("}")[-1]
        style = {
            **inherited,
            **{key: value for key, value in element.attrib.items()
               if key in {"font-family", "font-weight", "font-style"}},
        }
        inline = {}
        for part in element.get("style", "").split(";"):
            if ":" in part:
                key, value = part.split(":", 1)
                inline[key.strip()] = value.strip()
        style.update(inline)

        if tag in {"foreignObject", "script"}:
            issues.append("Forbidden element: " + tag)
        if tag == "image":
            raster += 1
            href = element.get("href", element.get("{http://www.w3.org/1999/xlink}href", ""))
            if not href:
                issues.append("Image has no source")
            if require_pure_vector:
                issues.append("Raster image in pure-vector request")
        for key, value in element.attrib.items():
            if key.endswith("href") and not value.startswith("#"):
                if tag == "image" and value.startswith(("data:image/png;base64,", "data:image/jpeg;base64,")):
                    try:
                        header, payload = value.split(",", 1)
                        raw = base64.b64decode(payload, validate=True)
                        signature = b"\x89PNG\r\n\x1a\n" if "image/png" in header else b"\xff\xd8\xff"
                        if not raw.startswith(signature):
                            issues.append("Invalid embedded image signature")
                    except (ValueError, binascii.Error):
                        issues.append("Invalid embedded image encoding")
                else:
                    issues.append("External or unsupported resource: " + value[:100])
            if "url(" in value and "url(#" not in value:
                issues.append("External resource: " + value[:100])

        if tag in {"text", "tspan"}:
            record_run(element.text or "", style)
        for child in element:
            walk(child, style)
            if tag in {"text", "tspan"}:
                # SVG stores text after an inline tspan in the child's tail;
                # it inherits the surrounding text element's style.
                record_run(child.tail or "", style)

    walk(root, {})
    missing = set()
    for value, family, font, _font_path in runs:
        cmap = font.getBestCmap()
        for char in value:
            if not char.isspace() and ord(char) not in cmap:
                missing.add((family, char))
    for family, char in sorted(missing):
        issues.append(f"Missing glyph U+{ord(char):04X} ({char}) in {family}")

    for font in loaded_fonts.values():
        if font is not None:
            font.close()

    families = sorted({family for _value, family, _font, _path in runs})
    font_versions = sorted({FAMILY_VERSIONS[family] for family in families})
    return {
        "file": str(path),
        "font": " + ".join(font_versions) if font_versions else "UND v3.0",
        "fontVersions": font_versions,
        "fontFamilies": families,
        "fontFiles": sorted(set(used_files.values())),
        "textRuns": len(runs),
        "uniqueCharacters": len(set("".join(value for value, *_ in runs))),
        "vectorPaths": sum(1 for element in root.iter() if element.tag.endswith("}path")),
        "rasterImages": raster,
        "artworkMode": "hybrid" if raster else "vector",
        "requirePureVector": require_pure_vector,
        "missingGlyphs": sorted({char for _family, char in missing}),
        "horizontalScaleVerified": False,
        "horizontalScaleNote": "The audit does not verify 95% horizontal scale or equivalent glyph-ink transforms.",
        "issues": issues,
        "passed": not issues,
        "visualReviewRequired": True,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("svg", nargs="+", type=Path)
    parser.add_argument("--font", type=Path, help="UND v3.0 Regular OTF")
    parser.add_argument("--bold-font", type=Path, help="UND v3.0 Bold OTF")
    parser.add_argument("--italic-font", type=Path, help="UND v3.0 Italic OTF")
    parser.add_argument("--bold-italic-font", type=Path, help="UND v3.0 Bold Italic OTF")
    parser.add_argument("--batang-font", "--batang-regular-font", dest="batang_font", type=Path,
                        help="UND v3.0 Batang Regular OTF")
    parser.add_argument("--batang-bold-font", type=Path, help="UND v3.0 Batang Bold OTF")
    parser.add_argument("--batang-italic-font", type=Path, help="UND v3.0 Batang Italic OTF")
    parser.add_argument("--batang-bold-italic-font", type=Path, help="UND v3.0 Batang Bold Italic OTF")
    parser.add_argument("--v31-font", "--v31-regular-font", dest="v31_font", type=Path,
                        help="UND v3.1 Regular TTF; used only for font-family UND v3.1")
    parser.add_argument("--v31-bold-font", type=Path,
                        help="UND v3.1 Bold TTF; used only for font-family UND v3.1")
    parser.add_argument("--v31-italic-font", type=Path,
                        help="UND v3.1 Italic TTF; used only for font-family UND v3.1")
    parser.add_argument("--v31-bold-italic-font", type=Path,
                        help="UND v3.1 Bold Italic TTF; used only for font-family UND v3.1")
    parser.add_argument("--v31-batang-font", "--v31-batang-regular-font", dest="v31_batang_font", type=Path,
                        help="UND v3.1 Batang Regular for font-family UND v3.1 Batang; extension is not assumed")
    parser.add_argument("--v31-batang-bold-font", type=Path,
                        help="UND v3.1 Batang Bold for font-family UND v3.1 Batang; extension is not assumed")
    parser.add_argument("--v31-batang-italic-font", type=Path,
                        help="UND v3.1 Batang Italic for font-family UND v3.1 Batang; extension is not assumed")
    parser.add_argument("--v31-batang-bold-italic-font", type=Path,
                        help="UND v3.1 Batang Bold Italic for font-family UND v3.1 Batang; extension is not assumed")
    parser.add_argument("--output", type=Path)
    parser.add_argument("--require-pure-vector", action="store_true",
                        help="Reject raster only when the user requires pure-vector artwork")
    args = parser.parse_args()

    results = [audit(svg, args, args.require_pure_vector) for svg in args.svg]
    output = json.dumps(results, ensure_ascii=False, indent=2)
    if args.output:
        args.output.write_text(output)
    print(output)
    return 0 if all(result["passed"] for result in results) else 1


if __name__ == "__main__":
    sys.exit(main())
