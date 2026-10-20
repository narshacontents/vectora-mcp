import importlib.util
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "skills/create-kice-illustration/scripts/audit_svg.py"
SPEC = importlib.util.spec_from_file_location("audit_svg_under_test", SCRIPT)
audit_svg = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(audit_svg)

FONTS = {
    ("main", "regular"): ("UND v3.0", "UNDv30-Regular", "Regular"),
    ("main", "bold"): ("UND v3.0", "UNDv30-Bold", "Bold"),
    ("main", "italic"): ("UND v3.0", "UNDv30-Italic", "Italic"),
    ("main", "bold-italic"): ("UND v3.0", "UNDv30-BoldItalic", "Bold Italic"),
    ("batang", "regular"): ("UND v3.0 Batang", "UNDv30Batang-Regular", "Regular"),
    ("batang", "bold"): ("UND v3.0 Batang", "UNDv30Batang-Bold", "Bold"),
    ("batang", "italic"): ("UND v3.0 Batang", "UNDv30Batang-Italic", "Italic"),
    ("batang", "bold-italic"): ("UND v3.0 Batang", "UNDv30Batang-BoldItalic", "Bold Italic"),
    ("main31", "regular"): ("UND v3.1", "UNDv31-Regular", "Regular"),
    ("main31", "bold"): ("UND v3.1", "UNDv31-Bold", "Bold"),
    ("main31", "italic"): ("UND v3.1", "UNDv31-Italic", "Italic"),
    ("main31", "bold-italic"): ("UND v3.1", "UNDv31-BoldItalic", "Bold Italic"),
    ("batang31", "regular"): ("UND v3.1 Batang", "UNDv31Batang-Regular", "Regular"),
    ("batang31", "bold"): ("UND v3.1 Batang", "UNDv31Batang-Bold", "Bold"),
    ("batang31", "italic"): ("UND v3.1 Batang", "UNDv31Batang-Italic", "Italic"),
    ("batang31", "bold-italic"): ("UND v3.1 Batang", "UNDv31Batang-BoldItalic", "Bold Italic"),
}


def make_font(path, family, style, postscript_name, codepoints=(ord("A"), 0xAC00)):
    glyph_names = [".notdef"]
    cmap = {}
    for codepoint in codepoints:
        glyph_name = "A" if codepoint == ord("A") else f"uni{codepoint:04X}"
        glyph_names.append(glyph_name)
        cmap[codepoint] = glyph_name

    builder = FontBuilder(1000, isTTF=True)
    builder.setupGlyphOrder(glyph_names)
    builder.setupCharacterMap(cmap)
    builder.setupGlyf({name: TTGlyphPen(None).glyph() for name in glyph_names})
    builder.setupHorizontalMetrics({name: (600, 0) for name in glyph_names})
    builder.setupHorizontalHeader(ascent=800, descent=-200)
    builder.setupNameTable({
        "familyName": family,
        "styleName": style,
        "uniqueFontIdentifier": f"{postscript_name}; synthetic test face",
        "fullName": f"{family} {style}",
        "psName": postscript_name,
        "typographicFamily": family,
        "typographicSubfamily": style,
    })
    builder.setupOS2(sTypoAscender=800, sTypoDescender=-200, usWinAscent=800, usWinDescent=200)
    builder.setupPost()
    builder.setupMaxp()
    builder.save(path)


def svg_text(family, text="A", style="regular"):
    weight = "bold" if "bold" in style else "normal"
    font_style = "italic" if "italic" in style else "normal"
    return (
        '<svg xmlns="http://www.w3.org/2000/svg">'
        f'<text font-family="{family}" font-weight="{weight}" font-style="{font_style}">{text}</text>'
        "</svg>"
    )


class AuditSvgFontFaceTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        self.font_paths = {}
        for face, (family, postscript_name, style) in FONTS.items():
            font_path = self.root / f"{postscript_name}.ttf"
            make_font(font_path, family, style, postscript_name)
            self.font_paths[face] = font_path

    def tearDown(self):
        self.temporary.cleanup()

    def args(self, **overrides):
        values = {
            "font": self.font_paths[("main", "regular")],
            "bold_font": self.font_paths[("main", "bold")],
            "italic_font": self.font_paths[("main", "italic")],
            "bold_italic_font": self.font_paths[("main", "bold-italic")],
            "batang_font": self.font_paths[("batang", "regular")],
            "batang_bold_font": self.font_paths[("batang", "bold")],
            "batang_italic_font": self.font_paths[("batang", "italic")],
            "batang_bold_italic_font": self.font_paths[("batang", "bold-italic")],
            "v31_font": self.font_paths[("main31", "regular")],
            "v31_bold_font": self.font_paths[("main31", "bold")],
            "v31_italic_font": self.font_paths[("main31", "italic")],
            "v31_bold_italic_font": self.font_paths[("main31", "bold-italic")],
            "v31_batang_font": self.font_paths[("batang31", "regular")],
            "v31_batang_bold_font": self.font_paths[("batang31", "bold")],
            "v31_batang_italic_font": self.font_paths[("batang31", "italic")],
            "v31_batang_bold_italic_font": self.font_paths[("batang31", "bold-italic")],
        }
        values.update(overrides)
        return SimpleNamespace(**values)

    def args_with_only_v31_regular_anchor(self, anchor):
        names = (
            "font", "bold_font", "italic_font", "bold_italic_font",
            "batang_font", "batang_bold_font", "batang_italic_font", "batang_bold_italic_font",
            "v31_font", "v31_bold_font", "v31_italic_font", "v31_bold_italic_font",
            "v31_batang_font", "v31_batang_bold_font", "v31_batang_italic_font", "v31_batang_bold_italic_font",
        )
        return SimpleNamespace(**{name: anchor if name == "v31_font" else None for name in names})

    def write_svg(self, name, contents):
        path = self.root / name
        path.write_text(contents, encoding="utf-8")
        return path

    def test_all_eight_face_metadata_contracts_and_cmaps_are_audited(self):
        runs = []
        for (family_key, style), (family, _postscript_name, _subfamily) in FONTS.items():
            if family_key in {"main", "batang"}:
                runs.append(svg_text(family, style=style))
        svg = self.write_svg("all-faces.svg", '<svg xmlns="http://www.w3.org/2000/svg">' + "".join(runs) + "</svg>")

        result = audit_svg.audit(svg, self.args())

        self.assertTrue(result["passed"], result["issues"])
        self.assertEqual(result["textRuns"], 8)
        self.assertEqual(len(result["fontFiles"]), 8)
        self.assertEqual(result["fontFamilies"], ["UND v3.0", "UND v3.0 Batang"])
        self.assertFalse(result["horizontalScaleVerified"])
        self.assertIn("95% horizontal scale", result["horizontalScaleNote"])

    def test_all_four_v31_face_metadata_contracts_and_cmaps_are_audited(self):
        runs = [
            svg_text(family, style=style)
            for (family_key, style), (family, _postscript_name, _subfamily) in FONTS.items()
            if family_key == "main31"
        ]
        svg = self.write_svg("v31-faces.svg", '<svg xmlns="http://www.w3.org/2000/svg">' + "".join(runs) + "</svg>")

        result = audit_svg.audit(svg, self.args())

        self.assertTrue(result["passed"], result["issues"])
        self.assertEqual(result["textRuns"], 4)
        self.assertEqual(result["fontFamilies"], ["UND v3.1"])
        self.assertEqual(result["fontVersions"], ["UND v3.1"])
        self.assertEqual(result["font"], "UND v3.1")

    def test_all_four_v31_batang_face_metadata_contracts_and_cmaps_are_audited(self):
        runs = [
            svg_text(family, style=style)
            for (family_key, style), (family, _postscript_name, _subfamily) in FONTS.items()
            if family_key == "batang31"
        ]
        svg = self.write_svg("v31-batang-faces.svg", '<svg xmlns="http://www.w3.org/2000/svg">' + "".join(runs) + "</svg>")

        result = audit_svg.audit(svg, self.args())

        self.assertTrue(result["passed"], result["issues"])
        self.assertEqual(result["textRuns"], 4)
        self.assertEqual(result["fontFamilies"], ["UND v3.1 Batang"])
        self.assertEqual(result["fontVersions"], ["UND v3.1"])

    def test_v31_batang_discovery_uses_exact_stem_without_assuming_extension(self):
        font_dir = self.root / "extension-unspecified"
        font_dir.mkdir()
        v31_regular = font_dir / "UNDv31-Regular.ttf"
        batang_regular = font_dir / "UNDv31Batang-Regular"
        make_font(v31_regular, "UND v3.1", "Regular", "UNDv31-Regular")
        make_font(batang_regular, "UND v3.1 Batang", "Regular", "UNDv31Batang-Regular")
        svg = self.write_svg("v31-batang-discovery.svg", svg_text("UND v3.1 Batang"))

        result = audit_svg.audit(svg, self.args_with_only_v31_regular_anchor(v31_regular))

        self.assertTrue(result["passed"], result["issues"])
        self.assertEqual(result["fontFiles"], [str(batang_regular)])
        self.assertEqual(result["fontVersions"], ["UND v3.1"])

    def test_v31_batang_discovery_rejects_multiple_extension_candidates(self):
        font_dir = self.root / "ambiguous-batang-files"
        font_dir.mkdir()
        v31_regular = font_dir / "UNDv31-Regular.ttf"
        first = font_dir / "UNDv31Batang-Regular.first"
        second = font_dir / "UNDv31Batang-Regular.second"
        make_font(v31_regular, "UND v3.1", "Regular", "UNDv31-Regular")
        make_font(first, "UND v3.1 Batang", "Regular", "UNDv31Batang-Regular")
        make_font(second, "UND v3.1 Batang", "Regular", "UNDv31Batang-Regular")
        svg = self.write_svg("ambiguous-v31-batang.svg", svg_text("UND v3.1 Batang"))

        result = audit_svg.audit(svg, self.args_with_only_v31_regular_anchor(v31_regular))

        self.assertFalse(result["passed"])
        self.assertTrue(any("Ambiguous font face file for UND v3.1 Batang regular" in issue for issue in result["issues"]))

    def test_v30_batang_face_is_not_a_v31_batang_fallback(self):
        font_dir = self.root / "v30-batang-only"
        font_dir.mkdir()
        v30_regular = font_dir / "UNDv30Batang-Regular.otf"
        make_font(v30_regular, "UND v3.0 Batang", "Regular", "UNDv30Batang-Regular")
        provided = {("batang", "regular"): v30_regular, ("batang31", "regular"): None}

        resolved = audit_svg._resolve_path(("batang31", "regular"), provided, [])

        self.assertIsNone(resolved)

    def test_mixed_versions_use_version_specific_discovery_in_shared_directory(self):
        font_dir = self.root / "mixed-fonts"
        font_dir.mkdir()
        v30_regular = font_dir / "UND-v3.0-Regular.otf"
        v31_regular = font_dir / "UNDv31-Regular.ttf"
        make_font(v30_regular, "UND v3.0", "Regular", "UNDv30-Regular")
        make_font(v31_regular, "UND v3.1", "Regular", "UNDv31-Regular")
        svg = self.write_svg(
            "mixed-versions.svg",
            '<svg xmlns="http://www.w3.org/2000/svg">'
            + svg_text("UND v3.0")
            + svg_text("UND v3.1")
            + "</svg>",
        )

        result = audit_svg.audit(svg, self.args(font=v30_regular, v31_font=None))

        self.assertTrue(result["passed"], result["issues"])
        self.assertEqual(result["fontFamilies"], ["UND v3.0", "UND v3.1"])
        self.assertEqual(result["fontVersions"], ["UND v3.0", "UND v3.1"])
        self.assertEqual(result["font"], "UND v3.0 + UND v3.1")
        self.assertEqual(set(result["fontFiles"]), {str(v30_regular), str(v31_regular)})

    def test_v30_file_is_not_a_v31_discovery_fallback(self):
        font_dir = self.root / "v30-only"
        font_dir.mkdir()
        v30_regular = font_dir / "UND-v3.0-Regular.otf"
        make_font(v30_regular, "UND v3.0", "Regular", "UNDv30-Regular")
        provided = {
            ("main", "regular"): v30_regular,
            ("main31", "regular"): None,
        }

        resolved = audit_svg._resolve_path(("main31", "regular"), provided, [])

        self.assertIsNone(resolved)

    def test_v31_default_discovery_uses_confirmed_ttf_filename(self):
        font_dir = self.root / "v31-ttf-discovery"
        font_dir.mkdir()
        v31_bold = font_dir / "UNDv31-Bold.ttf"
        make_font(v31_bold, "UND v3.1", "Bold", "UNDv31-Bold")
        args = self.args_with_only_v31_regular_anchor(None)

        resolved = audit_svg._resolve_path(
            ("main31", "bold"), audit_svg._provided_paths(args), [font_dir]
        )

        self.assertEqual(resolved, v31_bold)

    def test_v31_discovery_requires_ttf_filename_not_otf(self):
        font_dir = self.root / "v31-otf-only"
        font_dir.mkdir()
        v30_regular = font_dir / "UND-v3.0-Regular.otf"
        v31_otf = font_dir / "UNDv31-Regular.otf"
        make_font(v30_regular, "UND v3.0", "Regular", "UNDv30-Regular")
        make_font(v31_otf, "UND v3.1", "Regular", "UNDv31-Regular")
        provided = {
            ("main", "regular"): v30_regular,
            ("main31", "regular"): None,
        }

        resolved = audit_svg._resolve_path(("main31", "regular"), provided, [])

        self.assertIsNone(resolved)

    def test_v31_metadata_must_match_postscript_family_and_subfamily(self):
        wrong = self.root / "wrong-v31-metadata.ttf"
        make_font(wrong, "UND v3.0", "Italic", "UNDv30-Regular")
        svg = self.write_svg("wrong-v31-metadata.svg", svg_text("UND v3.1"))

        result = audit_svg.audit(svg, self.args(v31_font=wrong))

        self.assertFalse(result["passed"])
        self.assertTrue(any("Wrong PostScript face for UND v3.1 regular" in issue for issue in result["issues"]))
        self.assertTrue(any("Wrong family name for UND v3.1 regular" in issue for issue in result["issues"]))
        self.assertTrue(any("Wrong subfamily style for UND v3.1 regular" in issue for issue in result["issues"]))

    def test_body_family_is_rejected_without_a_legacy_opt_in(self):
        svg = self.write_svg("body.svg", svg_text("UND v3.0 Body"))

        result = audit_svg.audit(svg, self.args())

        self.assertFalse(result["passed"])
        self.assertTrue(any("Unsupported or missing font family: UND v3.0 Body" in issue for issue in result["issues"]))

    def test_bold_italic_requires_its_own_explicit_font_file(self):
        svg = self.write_svg("bold-italic.svg", svg_text("UND v3.0", style="bold-italic"))
        missing_path = self.root / "not-built-yet.otf"
        args = self.args(bold_italic_font=missing_path)

        result = audit_svg.audit(svg, args)

        self.assertFalse(result["passed"])
        self.assertTrue(any("Font face file unavailable: UND v3.0 bold-italic" in issue for issue in result["issues"]))

    def test_postscript_family_and_subfamily_names_must_match(self):
        wrong_ps = self.root / "wrong-ps.ttf"
        make_font(wrong_ps, "UND v3.0", "Regular", "Wrong-PostScript")
        svg = self.write_svg("wrong-ps.svg", svg_text("UND v3.0"))
        result = audit_svg.audit(svg, self.args(font=wrong_ps))
        self.assertFalse(result["passed"])
        self.assertTrue(any("Wrong PostScript face" in issue for issue in result["issues"]))

        wrong_family_style = self.root / "wrong-family-style.ttf"
        make_font(wrong_family_style, "Unrelated Family", "Italic", "UNDv30Batang-Bold")
        svg = self.write_svg("wrong-family-style.svg", svg_text("UND v3.0 Batang", style="bold"))
        args = self.args(batang_bold_font=wrong_family_style)
        result = audit_svg.audit(svg, args)
        self.assertFalse(result["passed"])
        self.assertTrue(any("Wrong family name" in issue for issue in result["issues"]))
        self.assertTrue(any("Wrong subfamily style" in issue for issue in result["issues"]))

    def test_missing_glyph_still_fails_cmap_audit(self):
        svg = self.write_svg("missing-glyph.svg", svg_text("UND v3.0", text="B"))

        result = audit_svg.audit(svg, self.args())

        self.assertFalse(result["passed"])
        self.assertIn("B", result["missingGlyphs"])
        self.assertTrue(any("Missing glyph U+0042" in issue for issue in result["issues"]))

        v31_svg = self.write_svg("missing-v31-glyph.svg", svg_text("UND v3.1", text="B"))
        v31_result = audit_svg.audit(v31_svg, self.args())
        self.assertFalse(v31_result["passed"])
        self.assertIn("B", v31_result["missingGlyphs"])
        self.assertTrue(any("Missing glyph U+0042 (B) in UND v3.1" in issue for issue in v31_result["issues"]))

        v31_batang_svg = self.write_svg("missing-v31-batang-glyph.svg", svg_text("UND v3.1 Batang", text="B"))
        v31_batang_result = audit_svg.audit(v31_batang_svg, self.args())
        self.assertFalse(v31_batang_result["passed"])
        self.assertTrue(any("Missing glyph U+0042 (B) in UND v3.1 Batang" in issue for issue in v31_batang_result["issues"]))

    def test_cli_preserves_legacy_paths_adds_v31_paths_and_no_body_option(self):
        result = subprocess.run(
            [sys.executable, str(SCRIPT), "--help"],
            check=True,
            capture_output=True,
            text=True,
        )

        for option in (
            "--font",
            "--bold-font",
            "--italic-font",
            "--bold-italic-font",
            "--batang-font",
            "--batang-bold-font",
            "--batang-italic-font",
            "--batang-bold-italic-font",
            "--v31-font",
            "--v31-regular-font",
            "--v31-bold-font",
            "--v31-italic-font",
            "--v31-bold-italic-font",
            "--v31-batang-font",
            "--v31-batang-regular-font",
            "--v31-batang-bold-font",
            "--v31-batang-italic-font",
            "--v31-batang-bold-italic-font",
        ):
            self.assertIn(option, result.stdout)
        self.assertIn("UND v3.1 Regular TTF", result.stdout)
        self.assertNotIn("--body-font", result.stdout)


if __name__ == "__main__":
    unittest.main()
