"""Engraves a portrait photograph as an SVG plate for the About book.

The photo is drawn as a copperplate engraving, background and all: parallel
lines whose weight follows the shading, cross-hatched where the shadows are
deepest, inside a plate with a brass double rule. MediaPipe's multiclass
selfie segmenter tells the person's hair, skin and clothes from the scene
behind them, and each is hatched at its own angle, so the person stands out
from the room as an engraver would cut them. Only the lines are drawn, in the
pages' ink, so the paper of the page shows through. Each set of lines is
written as straight runs in its own rotated frame, which keeps the file small.
The drawing keeps the photo's (or the crop's) shape, 800 units tall.

Setup, outside the project:

    python3 -m venv .venv && .venv/bin/pip install mediapipe numpy pillow
    curl -LO https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite

Then (optionally with --crop left,top,right,bottom in the photo's pixels):

    .venv/bin/python scripts/engrave-portrait.py photo.jpg \
        --model selfie_multiclass_256x256.tflite --out assets/books/author-portrait.svg
"""

import argparse
import math
from typing import NamedTuple

import numpy as np
from PIL import Image, ImageFilter

HEIGHT = 800
INK = "#2a1f1a"
BRASS = "#b8913a"
# Inset of the plate (where the engraving is cut off) from the drawing's edge, and of its brass rule.
PLATE_INSET = 14
RULE_INSET = 7
# How far apart the lines are, against the spacings below: set for a plate shown about 500 CSS pixels wide
# (for a landscape photo), where lines much closer than 2.5 pixels apart blur into each other.
LINE_SPACING = 1.5
# Line weights, as shares of the line spacing: tone is rounded to the nearest.
LEVELS = np.array([0.12, 0.26, 0.42, 0.6, 0.8, 1.0])
SEGMENT_CLASSES = ["background", "hair", "body", "face", "clothes", "others"]


class Size(NamedTuple):
    width: int
    height: int


def segment(photo_path, model_path):
    """Confidence masks for each of the segmenter's classes, at the photo's size."""
    import mediapipe as mp
    from mediapipe.tasks import python as mp_python
    from mediapipe.tasks.python import vision

    options = vision.ImageSegmenterOptions(base_options=mp_python.BaseOptions(model_asset_path=model_path), output_confidence_masks=True)
    with vision.ImageSegmenter.create_from_options(options) as segmenter:
        result = segmenter.segment(mp.Image.create_from_file(photo_path))
        return {name: np.squeeze(mask.numpy_view().copy()) for name, mask in zip(SEGMENT_CLASSES, result.confidence_masks)}


def blur(field, radius):
    image = Image.fromarray(np.clip(field * 255, 0, 255).astype(np.uint8))
    return np.asarray(image.filter(ImageFilter.GaussianBlur(radius))).astype(np.float32) / 255


def prepare(photo_path, crop, masks, size):
    """The photo's lightness and each region's mask, cropped and scaled to the drawing."""
    photo = Image.open(photo_path).convert("RGB").crop(crop).resize(size, Image.LANCZOS)
    rgb = np.asarray(photo).astype(np.float32) / 255
    lightness = 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]

    def region(name):
        mask = Image.fromarray((masks[name] * 255).astype(np.uint8)).crop(crop).resize(size, Image.BILINEAR)
        softened = np.asarray(mask.filter(ImageFilter.GaussianBlur(1.5))).astype(np.float32) / 255
        # The segmenter is unsure at the edges; this keeps them soft but drops the faint haze around the person.
        return np.clip((softened - 0.3) / 0.4, 0, 1)

    return lightness, {name: region(name) for name in SEGMENT_CLASSES}


def sample(field, xs, ys):
    """Bilinear samples of field at the given points."""
    height, width = field.shape
    xs = np.clip(xs, 0, width - 1.001)
    ys = np.clip(ys, 0, height - 1.001)
    x0 = np.floor(xs).astype(int)
    y0 = np.floor(ys).astype(int)
    fx = xs - x0
    fy = ys - y0
    top = field[y0, x0] * (1 - fx) + field[y0, x0 + 1] * fx
    bottom = field[y0 + 1, x0] * (1 - fx) + field[y0 + 1, x0 + 1] * fx
    return top * (1 - fy) + bottom * fy


def format_number(value):
    text = f"{value:.1f}"
    return text[:-2] if text.endswith(".0") else text


def hatch(angle, spacing, tone, step=1.0, fill=0.92):
    """
    Parallel lines at angle (degrees) whose weight follows tone (0 to 1).
    Returns the angle and the path data for each line weight, in a frame
    rotated by the angle about the drawing's centre: each run is horizontal
    there, and runs on the same line are written relative to the last.
    """
    height, width = tone.shape
    spacing *= LINE_SPACING
    centre_x, centre_y = width / 2, height / 2
    along_x, along_y = math.cos(math.radians(angle)), math.sin(math.radians(angle))
    across_x, across_y = -along_y, along_x
    half = math.hypot(width, height) / 2
    positions = np.arange(-half, half, step)
    thresholds = (LEVELS[:-1] + LEVELS[1:]) / 2
    paths = {}
    last_end = {}
    line_count = int(half / spacing) + 1
    for line in range(-line_count, line_count + 1):
        offset = line * spacing
        xs = centre_x + offset * across_x + positions * along_x
        ys = centre_y + offset * across_y + positions * along_y
        inside = (xs >= 0) & (xs < width) & (ys >= 0) & (ys < height)
        if not inside.any():
            continue
        value = np.where(inside, sample(tone, xs, ys), 0)
        value = np.convolve(value, np.ones(3) / 3, mode="same")
        level = np.searchsorted(thresholds, value)
        level[value < LEVELS[0] * 0.6] = -1
        start = 0
        for index in range(1, len(positions) + 1):
            current = level[index] if index < len(positions) else -1
            previous = level[index - 1]
            if current == previous:
                continue
            if previous >= 0:
                weight = round(float(LEVELS[previous]) * spacing * fill, 2)
                begin = round(float(positions[start]), 1)
                length = round(float(positions[index - 1] - positions[start] + step), 1)
                end = last_end.get(weight)
                if end is not None and end[1] == offset:
                    paths[weight].append(f"m{format_number(begin - end[0])} 0h{format_number(length)}")
                else:
                    paths.setdefault(weight, []).append(f"M{format_number(begin)} {format_number(offset)}h{format_number(length)}")
                last_end[weight] = (round(begin + length, 1), offset)
            start = index
    return angle, paths


def inset_box(size, inset):
    return f'x="{inset}" y="{inset}" width="{size.width - 2 * inset}" height="{size.height - 2 * inset}"'


def render(hatchings, size):
    centre_x, centre_y = size.width / 2, size.height / 2
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{size.width}" height="{size.height}" viewBox="0 0 {size.width} {size.height}">',
        f'<defs><clipPath id="plate"><rect {inset_box(size, PLATE_INSET)}/></clipPath></defs>',
        f'<g clip-path="url(#plate)" fill="none" stroke="{INK}">',
    ]
    for angle, paths in hatchings:
        parts.append(f'<g transform="translate({centre_x:g} {centre_y:g}) rotate({angle:g})">')
        parts.extend(f'<path stroke-width="{weight:g}" d="{"".join(paths[weight])}"/>' for weight in sorted(paths))
        parts.append("</g>")
    parts.append("</g>")
    # A brass rule around the plate, and an ink hairline where the engraving stops.
    parts.append(
        f'<rect {inset_box(size, RULE_INSET)} fill="none" stroke="{BRASS}" stroke-width="2.5"/>'
        f'<rect {inset_box(size, PLATE_INSET)} fill="none" stroke="{INK}" stroke-width="1"/>'
    )
    parts.append("</svg>")
    return "".join(parts)


def engrave(lightness, regions):
    # Local contrast brings out the features, then a curve turns lightness into tone.
    detailed = np.clip(lightness + 0.55 * (lightness - blur(lightness, 18)), 0, 1)
    darkness = blur(np.clip((1 - detailed - 0.12) / 0.78, 0, 1) ** 1.15, 0.8)

    scene = regions["background"]
    skin = np.clip(regions["face"] + regions["body"], 0, 1)
    hair = regions["hair"]
    clothes = np.clip(regions["clothes"] + regions["others"], 0, 1)

    # Skin keeps a fine line even in its highlights, as an engraver would cut it; clothes sit lighter than they are.
    skin_tone = 0.12 + 0.84 * np.clip((darkness - 0.06) / 0.94, 0, 1) ** 1.25
    cloth_tone = np.clip(darkness * 0.55, 0, 1)
    hair_tone = np.clip(darkness * 1.1, 0, 1)
    # The room behind is simplified (its fine detail smoothed away), ruled level and set lighter than it is,
    # so the person comes forward from it.
    scene_tone = np.clip(blur(darkness, 2.5) * 0.72, 0, 1)

    def deepest(tone, from_tone):
        return np.clip((tone - from_tone) / (1 - from_tone), 0, 1)

    return [
        hatch(0, 3.6, scene_tone * scene),
        hatch(45, 3.6, deepest(scene_tone, 0.5) * scene),
        hatch(-14, 3.0, skin_tone * skin),
        hatch(48, 3.0, deepest(skin_tone, 0.62) * skin),
        hatch(62, 3.4, hair_tone * hair),
        hatch(-28, 3.4, deepest(darkness, 0.5) * hair),
        hatch(32, 4.4, cloth_tone * clothes),
        hatch(-42, 4.4, deepest(cloth_tone, 0.6) * clothes),
    ]


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("photo")
    parser.add_argument("--crop", help="left,top,right,bottom in the photo's pixels (the whole photo if left out)")
    parser.add_argument("--model", required=True, help="MediaPipe selfie_multiclass_256x256.tflite")
    parser.add_argument("--out", required=True)
    args = parser.parse_args()
    with Image.open(args.photo) as photo:
        crop = tuple(int(value) for value in args.crop.split(",")) if args.crop else (0, 0, *photo.size)
    size = Size(round(HEIGHT * (crop[2] - crop[0]) / (crop[3] - crop[1])), HEIGHT)

    lightness, regions = prepare(args.photo, crop, segment(args.photo, args.model), size)
    svg = render(engrave(lightness, regions), size)
    with open(args.out, "w") as handle:
        handle.write(svg)
    print(f"{args.out}: {len(svg)} bytes")


if __name__ == "__main__":
    main()
