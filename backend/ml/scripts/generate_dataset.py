"""
Synthetic Microplastic Microscope Dataset Generator
Generates realistic optical microscopy water sample images containing microplastics:
- 0: fiber
- 1: fragment
- 2: pellet
- 3: film
- 4: sphere

Outputs:
- YOLO-formatted images and labels in ml/dataset/images/{train,val,test} and ml/dataset/labels/{train,val,test}
- Demo test samples for frontend one-click analysis in ml/dataset/samples/ and backend/app/static/demo_samples/
"""

import os
import json
import random
import math
import numpy as np
import cv2
from pathlib import Path

# Class definitions
CLASSES = {
    0: "fiber",
    1: "fragment",
    2: "pellet",
    3: "film",
    4: "sphere"
}

# Optical microscope simulation parameters
DEFAULT_WIDTH = 1024
DEFAULT_HEIGHT = 1024
PIXELS_PER_UM = 0.8  # 1 pixel approx 1.25 um

def create_microscope_background(width: int, height: int) -> np.ndarray:
    """Generate realistic microscope field of view with liquid medium background."""
    # Base fluid color: light pale gray-blue/amber microscope illumination
    base_color = np.array([
        random.randint(220, 245),
        random.randint(225, 248),
        random.randint(220, 245)
    ], dtype=np.float32)

    bg = np.ones((height, width, 3), dtype=np.float32) * base_color

    # Add lighting gradient / condenser illumination (brighter in center)
    y, x = np.ogrid[:height, :width]
    center_y, center_x = height / 2.0, width / 2.0
    dist_from_center = np.sqrt((x - center_x) ** 2 + (y - center_y) ** 2)
    max_radius = math.sqrt(center_x ** 2 + center_y ** 2)

    # Vignetting factor
    vignette = 1.0 - 0.25 * (dist_from_center / max_radius) ** 2
    vignette = np.clip(vignette, 0.7, 1.0)
    bg = bg * vignette[:, :, np.newaxis]

    # Add fluid particulate texture / subtle Perlin-like noise
    noise = np.random.normal(0, 3.5, (height, width, 3)).astype(np.float32)
    bg = np.clip(bg + noise, 0, 255).astype(np.uint8)

    # Add faint non-plastic organic background debris / dust specks
    num_debris = random.randint(15, 35)
    for _ in range(num_debris):
        dx = random.randint(0, width - 1)
        dy = random.randint(0, height - 1)
        d_size = random.randint(1, 4)
        d_color = (random.randint(180, 210), random.randint(180, 210), random.randint(180, 210))
        cv2.circle(bg, (dx, dy), d_size, d_color, -1)

    return bg


def draw_fiber(canvas: np.ndarray, x: int, y: int, max_dim: int):
    """Draw a synthetic polymer fiber (thread/filament)."""
    # Fiber colors: saturated blue, red, dark grey/black, teal
    fiber_colors = [
        (180, 50, 40),   # Deep Blue (BGR)
        (30, 40, 190),   # Bright Red
        (40, 40, 40),    # Black/Dark Grey
        (160, 130, 30),  # Cyan/Teal
        (140, 40, 150)   # Purple
    ]
    color = random.choice(fiber_colors)
    thickness = random.randint(3, 7)
    length = random.randint(int(max_dim * 0.4), max_dim)

    # Generate curved bezier-like spline points
    num_pts = random.randint(4, 7)
    pts = []
    curr_x, curr_y = x, y
    angle = random.uniform(0, 2 * math.pi)

    for i in range(num_pts):
        pts.append([int(curr_x), int(curr_y)])
        angle += random.uniform(-0.6, 0.6)
        step = length / (num_pts - 1)
        curr_x += step * math.cos(angle)
        curr_y += step * math.sin(angle)

    pts_arr = np.array(pts, dtype=np.int32).reshape((-1, 1, 2))
    cv2.polylines(canvas, [pts_arr], isClosed=False, color=color, thickness=thickness, lineType=cv2.LINE_AA)

    # Compute bounding box
    all_x = [p[0] for p in pts]
    all_y = [p[1] for p in pts]
    pad = thickness + 3
    x_min = max(0, min(all_x) - pad)
    y_min = max(0, min(all_y) - pad)
    x_max = min(canvas.shape[1] - 1, max(all_x) + pad)
    y_max = min(canvas.shape[0] - 1, max(all_y) + pad)

    # Size in um approx
    size_um = float(length / PIXELS_PER_UM)
    return x_min, y_min, x_max, y_max, size_um


def draw_fragment(canvas: np.ndarray, x: int, y: int, max_dim: int):
    """Draw an irregular angular polymer fragment."""
    colors = [
        (60, 120, 180),  # Orange-brown
        (160, 80, 50),   # Blue
        (40, 140, 50),   # Green
        (120, 120, 120), # Grey
        (20, 60, 160)    # Crimson
    ]
    color = random.choice(colors)
    num_vertices = random.randint(5, 9)
    radius = random.randint(int(max_dim * 0.3), int(max_dim * 0.7))

    pts = []
    for i in range(num_vertices):
        angle = i * (2 * math.pi / num_vertices) + random.uniform(-0.25, 0.25)
        r = radius * random.uniform(0.5, 1.3)
        vx = int(x + r * math.cos(angle))
        vy = int(y + r * math.sin(angle))
        pts.append([vx, vy])

    pts_arr = np.array(pts, dtype=np.int32).reshape((-1, 1, 2))
    cv2.fillPoly(canvas, [pts_arr], color=color, lineType=cv2.LINE_AA)
    # Highlight edge
    edge_color = tuple(max(0, c - 30) for c in color)
    cv2.polylines(canvas, [pts_arr], isClosed=True, color=edge_color, thickness=2, lineType=cv2.LINE_AA)

    all_x = [p[0] for p in pts]
    all_y = [p[1] for p in pts]
    pad = 4
    x_min = max(0, min(all_x) - pad)
    y_min = max(0, min(all_y) - pad)
    x_max = min(canvas.shape[1] - 1, max(all_x) + pad)
    y_max = min(canvas.shape[0] - 1, max(all_y) + pad)

    size_um = float((2 * radius) / PIXELS_PER_UM)
    return x_min, y_min, x_max, y_max, size_um


def draw_pellet(canvas: np.ndarray, x: int, y: int, max_dim: int):
    """Draw a smooth rounded or cylindrical virgin resin pellet."""
    colors = [
        (200, 200, 200), # Translucent white
        (50, 140, 220),  # Yellowish amber
        (190, 140, 100), # Light blue
        (160, 160, 170)  # Off-white
    ]
    color = random.choice(colors)
    axis_x = random.randint(int(max_dim * 0.3), int(max_dim * 0.5))
    axis_y = int(axis_x * random.uniform(0.7, 1.0))
    angle = random.uniform(0, 180)

    cv2.ellipse(canvas, (x, y), (axis_x, axis_y), angle, 0, 360, color, -1, lineType=cv2.LINE_AA)
    # Add 3D shading / inner ring
    border_color = tuple(max(0, c - 45) for c in color)
    cv2.ellipse(canvas, (x, y), (axis_x, axis_y), angle, 0, 360, border_color, 2, lineType=cv2.LINE_AA)

    r_max = max(axis_x, axis_y)
    pad = 5
    x_min = max(0, x - r_max - pad)
    y_min = max(0, y - r_max - pad)
    x_max = min(canvas.shape[1] - 1, x + r_max + pad)
    y_max = min(canvas.shape[0] - 1, y + r_max + pad)

    size_um = float((2 * r_max) / PIXELS_PER_UM)
    return x_min, y_min, x_max, y_max, size_um


def draw_film(canvas: np.ndarray, x: int, y: int, max_dim: int):
    """Draw a translucent undulating plastic film."""
    overlay = canvas.copy()
    colors = [
        (180, 190, 210),
        (210, 190, 170),
        (190, 210, 190),
        (180, 180, 180)
    ]
    color = random.choice(colors)
    num_pts = random.randint(6, 10)
    radius = random.randint(int(max_dim * 0.4), int(max_dim * 0.8))

    pts = []
    for i in range(num_pts):
        angle = i * (2 * math.pi / num_pts)
        r = radius * random.uniform(0.6, 1.4)
        pts.append([int(x + r * math.cos(angle)), int(y + r * math.sin(angle))])

    pts_arr = np.array(pts, dtype=np.int32).reshape((-1, 1, 2))
    cv2.fillPoly(overlay, [pts_arr], color=color, lineType=cv2.LINE_AA)
    cv2.polylines(overlay, [pts_arr], isClosed=True, color=(120, 120, 120), thickness=2, lineType=cv2.LINE_AA)

    # Alpha blend to give translucency
    alpha = random.uniform(0.45, 0.7)
    cv2.addWeighted(overlay, alpha, canvas, 1 - alpha, 0, canvas)

    all_x = [p[0] for p in pts]
    all_y = [p[1] for p in pts]
    pad = 5
    x_min = max(0, min(all_x) - pad)
    y_min = max(0, min(all_y) - pad)
    x_max = min(canvas.shape[1] - 1, max(all_x) + pad)
    y_max = min(canvas.shape[0] - 1, max(all_y) + pad)

    size_um = float((2 * radius) / PIXELS_PER_UM)
    return x_min, y_min, x_max, y_max, size_um


def draw_sphere(canvas: np.ndarray, x: int, y: int, max_dim: int):
    """Draw a microbead sphere with reflection highlight."""
    radius = random.randint(int(max_dim * 0.2), int(max_dim * 0.45))
    colors = [
        (40, 100, 200),  # Red-Orange bead
        (180, 70, 40),   # Blue bead
        (60, 160, 80),   # Green bead
        (180, 180, 60),  # Cyan bead
        (80, 80, 200)    # Amber bead
    ]
    color = random.choice(colors)

    cv2.circle(canvas, (x, y), radius, color, -1, lineType=cv2.LINE_AA)
    # Outline
    border_color = tuple(max(0, c - 50) for c in color)
    cv2.circle(canvas, (x, y), radius, border_color, 2, lineType=cv2.LINE_AA)
    # Specular optical reflection highlight
    highlight_x = int(x - radius * 0.35)
    highlight_y = int(y - radius * 0.35)
    highlight_r = max(2, int(radius * 0.25))
    cv2.circle(canvas, (highlight_x, highlight_y), highlight_r, (255, 255, 255), -1, lineType=cv2.LINE_AA)

    pad = 4
    x_min = max(0, x - radius - pad)
    y_min = max(0, y - radius - pad)
    x_max = min(canvas.shape[1] - 1, x + radius + pad)
    y_max = min(canvas.shape[0] - 1, y + radius + pad)

    size_um = float((2 * radius) / PIXELS_PER_UM)
    return x_min, y_min, x_max, y_max, size_um


def generate_single_sample(width: int = DEFAULT_WIDTH, height: int = DEFAULT_HEIGHT, particle_range=(4, 18)):
    """Generate one synthetic microscope sample with annotations."""
    img = create_microscope_background(width, height)
    num_particles = random.randint(particle_range[0], particle_range[1])

    annotations = []
    particle_drawers = [
        (0, draw_fiber),
        (1, draw_fragment),
        (2, draw_pellet),
        (3, draw_film),
        (4, draw_sphere)
    ]

    for _ in range(num_particles):
        class_id, drawer = random.choice(particle_drawers)
        max_dim = random.randint(35, 130)
        # Position with margin from border
        margin = max_dim + 20
        px = random.randint(margin, width - margin)
        py = random.randint(margin, height - margin)

        x_min, y_min, x_max, y_max, size_um = drawer(img, px, py, max_dim)

        # Normalize to YOLO format
        bbox_w = (x_max - x_min) / width
        bbox_h = (y_max - y_min) / height
        x_center = ((x_min + x_max) / 2.0) / width
        y_center = ((y_min + y_max) / 2.0) / height

        # Clip values to [0, 1]
        x_center = max(0.0, min(1.0, x_center))
        y_center = max(0.0, min(1.0, y_center))
        bbox_w = max(0.001, min(1.0, bbox_w))
        bbox_h = max(0.001, min(1.0, bbox_h))

        annotations.append({
            "class_id": class_id,
            "class_name": CLASSES[class_id],
            "x_center": x_center,
            "y_center": y_center,
            "width": bbox_w,
            "height": bbox_h,
            "x_min": x_min,
            "y_min": y_min,
            "x_max": x_max,
            "y_max": y_max,
            "size_um": round(size_um, 2),
            "confidence": round(random.uniform(0.85, 0.99), 3)
        })

    return img, annotations


def build_dataset(base_dir: Path, demo_dirs: list):
    """Generate train, val, test datasets and demo samples."""
    splits = {
        "train": 15,
        "val": 5,
        "test": 5
    }

    print("Generating Microplastic Microscope Dataset...")
    for split, count in splits.items():
        img_dir = base_dir / "images" / split
        lbl_dir = base_dir / "labels" / split
        img_dir.mkdir(parents=True, exist_ok=True)
        lbl_dir.mkdir(parents=True, exist_ok=True)

        for i in range(1, count + 1):
            filename = f"microscope_{split}_{i:03d}"
            img, annotations = generate_single_sample()

            # Save image
            img_path = img_dir / f"{filename}.png"
            cv2.imwrite(str(img_path), img)

            # Save YOLO txt format: <class_id> <x_center> <y_center> <width> <height>
            lbl_path = lbl_dir / f"{filename}.txt"
            with open(lbl_path, "w") as f:
                for a in annotations:
                    f.write(f"{a['class_id']} {a['x_center']:.6f} {a['y_center']:.6f} {a['width']:.6f} {a['height']:.6f}\n")

            # Save JSON metadata
            meta_path = lbl_dir / f"{filename}.json"
            with open(meta_path, "w") as f:
                json.dump({
                    "image_file": f"{filename}.png",
                    "width": DEFAULT_WIDTH,
                    "height": DEFAULT_HEIGHT,
                    "particle_count": len(annotations),
                    "particles": annotations
                }, f, indent=2)

        print(f"  [OK] Generated {count} samples for {split} split")

    # Generate specific curated demo samples with diverse contamination levels
    demo_scenarios = [
        {"name": "demo_low_lake_water", "label": "Lake Water Sample (Low Contamination)", "range": (2, 5), "vol": 1000.0},
        {"name": "demo_moderate_river_sample", "label": "River Estuary Sample (Moderate)", "range": (12, 18), "vol": 500.0},
        {"name": "demo_high_industrial_effluent", "label": "Industrial Effluent (High Contamination)", "range": (28, 42), "vol": 500.0},
        {"name": "demo_coastal_harbor_water", "label": "Coastal Harbor Water (Moderate)", "range": (14, 22), "vol": 750.0}
    ]

    for demo_dir in demo_dirs:
        demo_dir.mkdir(parents=True, exist_ok=True)
        for scen in demo_scenarios:
            img, annotations = generate_single_sample(particle_range=scen["range"])
            img_path = demo_dir / f"{scen['name']}.png"
            cv2.imwrite(str(img_path), img)

            meta_path = demo_dir / f"{scen['name']}.json"
            total_count = len(annotations)
            conc = total_count / (scen["vol"] / 1000.0)
            level = "LOW" if conc < 10.0 else ("HIGH" if conc > 50.0 else "MODERATE")

            with open(meta_path, "w") as f:
                json.dump({
                    "name": scen["name"],
                    "display_name": scen["label"],
                    "image_file": f"{scen['name']}.png",
                    "width": DEFAULT_WIDTH,
                    "height": DEFAULT_HEIGHT,
                    "recommended_volume_ml": scen["vol"],
                    "ground_truth_particle_count": total_count,
                    "ground_truth_concentration_particles_l": round(conc, 2),
                    "ground_truth_level": level,
                    "particles": annotations
                }, f, indent=2)
        print(f"  [OK] Curated {len(demo_scenarios)} demo microscope test samples in {demo_dir}")

    print("Dataset generation complete!")


if __name__ == "__main__":
    ml_dataset_dir = Path(__file__).resolve().parent.parent / "dataset"
    backend_demo_dir = Path(__file__).resolve().parent.parent.parent / "backend" / "app" / "static" / "demo_samples"
    ml_demo_dir = ml_dataset_dir / "samples"
    build_dataset(ml_dataset_dir, [ml_demo_dir, backend_demo_dir])
