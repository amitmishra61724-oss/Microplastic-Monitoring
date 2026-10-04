"""
Microplastic Detection and Particle Classification Engine
Implements computer vision and morphological machine learning to localize,
classify, and physically measure microplastic particles in optical microscope images.

Supported Particle Morphologies:
- fiber: Elongated filament / thread (nylon, polyester)
- fragment: Sharp, angular polygonal shard (polyethylene, polypropylene)
- pellet: Smooth rounded or cylindrical resin pellet / nurdle
- film: Thin, undulating translucent membrane sheet
- sphere: Circular microbead with specular highlight
"""

import math
import numpy as np
import cv2
from typing import List, Dict, Any, Tuple, Optional
import sys
from pathlib import Path

# Add project root to sys.path
project_root = Path(__file__).resolve().parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from ml.scripts.preprocess import MicroscopePreprocessor

CLASS_COLORS = {
    "fiber": (255, 90, 40),     # Bright Blue (BGR)
    "fragment": (40, 180, 240), # Vibrant Amber
    "pellet": (60, 220, 120),   # Bright Green
    "film": (200, 120, 220),    # Lavender / Purple
    "sphere": (50, 60, 240)     # Crimson Red
}

class MicroplasticDetector:
    """
    AI / Computer Vision Microplastic Particle Detector.
    Extracts candidate bounding boxes, analyzes morphological descriptors,
    estimates physical particle size (micrometers), and classifies polymer morphologies.
    """

    def __init__(self, confidence_threshold: float = 0.50, default_scale_um: float = 1.25):
        self.confidence_threshold = confidence_threshold
        self.preprocessor = MicroscopePreprocessor(default_pixel_scale_um=default_scale_um)

    def set_optical_magnification(self, objective: str):
        return self.preprocessor.set_optical_magnification(objective)

    def _morphological_features(self, contour, mask, img_bgr, rect) -> Dict[str, float]:
        """Compute comprehensive geometric and optical features for classification."""
        area = cv2.contourArea(contour)
        perimeter = cv2.arcLength(contour, True)

        if perimeter == 0 or area == 0:
            return None

        # Circularity / isoperimetric quotient: 4 * pi * Area / Perimeter^2
        circularity = (4.0 * math.pi * area) / (perimeter * perimeter)
        circularity = min(1.0, max(0.0, circularity))

        # Convex Hull and Solidity
        hull = cv2.convexHull(contour)
        hull_area = cv2.contourArea(hull)
        solidity = float(area / hull_area) if hull_area > 0 else 0.0

        # Minimum bounding rectangle (rotated) for true aspect ratio
        _, (rw, rh), _ = cv2.minAreaRect(contour)
        major_axis = max(rw, rh)
        minor_axis = max(1.0, min(rw, rh))
        aspect_ratio = major_axis / minor_axis

        # Extent in bounding box
        x, y, w, h = rect
        rect_area = w * h
        extent = float(area / rect_area) if rect_area > 0 else 0.0

        # Color variance and contrast inside contour
        c_mask = np.zeros(img_bgr.shape[:2], dtype=np.uint8)
        cv2.drawContours(c_mask, [contour], -1, 255, -1)
        mean_val, std_val = cv2.meanStdDev(img_bgr, mask=c_mask)
        color_std = float(np.mean(std_val))

        return {
            "area": area,
            "perimeter": perimeter,
            "circularity": circularity,
            "solidity": solidity,
            "aspect_ratio": aspect_ratio,
            "major_axis": major_axis,
            "minor_axis": minor_axis,
            "extent": extent,
            "color_std": color_std
        }

    def _classify_particle(self, features: Dict[str, float]) -> Tuple[str, float]:
        """
        Classify particle morphology using geometric and optical descriptors.
        Returns: (particle_type, confidence)
        """
        ar = features["aspect_ratio"]
        circ = features["circularity"]
        solidity = features["solidity"]
        extent = features["extent"]
        area = features["area"]

        # 1. FIBER: high aspect ratio, elongated slender thread
        if ar >= 3.2 or (ar >= 2.4 and solidity < 0.65):
            conf = min(0.98, 0.70 + (min(ar, 10.0) / 10.0) * 0.28)
            return "fiber", round(conf, 2)

        # 2. SPHERE: High circularity, high solidity, near 1:1 aspect ratio
        if circ >= 0.78 and solidity >= 0.88 and ar <= 1.35:
            conf = min(0.99, 0.75 + (circ * 0.24))
            return "sphere", round(conf, 2)

        # 3. PELLET: Compact, rounded/cylindrical, smooth edge (high solidity, moderate circ)
        if solidity >= 0.82 and 0.55 <= circ < 0.80 and ar <= 2.2:
            conf = min(0.96, 0.72 + (solidity * 0.24))
            return "pellet", round(conf, 2)

        # 4. FILM: Large surface area, irregular contour, lower solidity
        if area > 1200 and (solidity < 0.75 or extent < 0.55):
            conf = min(0.95, 0.70 + (1.0 - solidity) * 0.25)
            return "film", round(conf, 2)

        # 5. FRAGMENT: Angular jagged shard (default solid polymer piece)
        conf = min(0.97, 0.68 + (1.0 - abs(solidity - 0.75)) * 0.29)
        return "fragment", round(conf, 2)

    def _apply_nms(self, detections: List[Dict[str, Any]], iou_threshold: float = 0.35) -> List[Dict[str, Any]]:
        """Non-Maximum Suppression to remove redundant overlapping bounding boxes."""
        if not detections:
            return []

        boxes = np.array([[d["x_min"], d["y_min"], d["x_max"], d["y_max"]] for d in detections])
        scores = np.array([d["confidence"] for d in detections])

        x1 = boxes[:, 0]
        y1 = boxes[:, 1]
        x2 = boxes[:, 2]
        y2 = boxes[:, 3]
        areas = (x2 - x1) * (y2 - y1)
        order = scores.argsort()[::-1]

        keep = []
        while order.size > 0:
            i = order[0]
            keep.append(i)

            xx1 = np.maximum(x1[i], x1[order[1:]])
            yy1 = np.maximum(y1[i], y1[order[1:]])
            xx2 = np.minimum(x2[i], x2[order[1:]])
            yy2 = np.minimum(y2[i], y2[order[1:]])

            w = np.maximum(0.0, xx2 - xx1)
            h = np.maximum(0.0, yy2 - yy1)
            intersection = w * h

            iou = intersection / (areas[i] + areas[order[1:]] - intersection)
            inds = np.where(iou <= iou_threshold)[0]
            order = order[inds + 1]

        return [detections[idx] for idx in keep]

    def detect(self, image_bgr: np.ndarray, optical_scale_um: Optional[float] = None) -> Dict[str, Any]:
        """
        Execute full microplastic detection and characterization pipeline on an image.
        Returns:
            {
                "total_count": int,
                "particles": List[Dict],
                "particle_type_summary": Dict[str, int],
                "average_size_um": float,
                "optical_scale_um": float
            }
        """
        if optical_scale_um is not None:
            self.preprocessor.pixel_scale_um = optical_scale_um

        height, width = image_bgr.shape[:2]
        prep_artifacts = self.preprocessor.process(image_bgr)
        enhanced_bgr = prep_artifacts["preprocessed_bgr"]
        gray = cv2.cvtColor(enhanced_bgr, cv2.COLOR_BGR2GRAY)

        # Multi-scale adaptive thresholding & background subtraction
        bg_blur = cv2.GaussianBlur(gray, (55, 55), 0)
        diff = cv2.absdiff(gray, bg_blur)

        # Otsu thresholding combined with adaptive threshold
        _, thresh_otsu = cv2.threshold(diff, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        thresh_adapt = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 25, 4
        )
        combined_thresh = cv2.bitwise_or(thresh_otsu, thresh_adapt)

        # Morphological filtering to close small gaps in fibers and remove single-pixel salt noise
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        cleaned = cv2.morphologyEx(combined_thresh, cv2.MORPH_OPEN, kernel, iterations=1)
        cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_CLOSE, kernel, iterations=1)

        # Find connected components / contours
        contours, _ = cv2.findContours(cleaned, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        candidate_detections = []
        min_area = 25  # Filter out trivial noise specks (< 5 um)

        for contour in contours:
            area = cv2.contourArea(contour)
            if area < min_area:
                continue

            x, y, w, h = cv2.boundingRect(contour)

            # Filter edge artifacts from the camera microscope aperture border
            border_margin = 8
            if x <= border_margin or y <= border_margin or (x + w) >= (width - border_margin) or (y + h) >= (height - border_margin):
                continue

            feats = self._morphological_features(contour, cleaned, enhanced_bgr, (x, y, w, h))
            if not feats:
                continue

            p_type, conf = self._classify_particle(feats)
            if conf < self.confidence_threshold:
                continue

            # Physical dimension in micrometers
            size_um = self.preprocessor.pixels_to_micrometers(feats["major_axis"])

            candidate_detections.append({
                "particle_type": p_type,
                "confidence": conf,
                "size_um": size_um,
                "x_min": float(x),
                "y_min": float(y),
                "x_max": float(x + w),
                "y_max": float(y + h),
                "normalized": {
                    "x_min": round(x / width, 4),
                    "y_min": round(y / height, 4),
                    "x_max": round((x + w) / width, 4),
                    "y_max": round((y + h) / height, 4)
                }
            })

        # Apply Non-Maximum Suppression
        final_particles = self._apply_nms(candidate_detections, iou_threshold=0.30)

        # Compute summary metrics
        type_summary = {"fiber": 0, "fragment": 0, "pellet": 0, "film": 0, "sphere": 0}
        total_size = 0.0
        for p in final_particles:
            p_type = p["particle_type"]
            type_summary[p_type] = type_summary.get(p_type, 0) + 1
            total_size += p["size_um"]

        avg_size = round(total_size / len(final_particles), 2) if final_particles else 0.0

        return {
            "total_count": len(final_particles),
            "particles": final_particles,
            "particle_type_summary": type_summary,
            "average_size_um": avg_size,
            "optical_scale_um": self.preprocessor.pixel_scale_um
        }

    def render_annotated_image(self, image_bgr: np.ndarray, detections: List[Dict[str, Any]]) -> np.ndarray:
        """
        Draw high-visibility laboratory bounding boxes and annotations onto the image.
        """
        annotated = image_bgr.copy()

        for idx, p in enumerate(detections, 1):
            p_type = p["particle_type"]
            conf = p["confidence"]
            size_um = p.get("size_um", 0.0)
            color = CLASS_COLORS.get(p_type, (0, 255, 0))

            x1 = int(p["x_min"])
            y1 = int(p["y_min"])
            x2 = int(p["x_max"])
            y2 = int(p["y_max"])

            # Draw glowing bounding box
            cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2, cv2.LINE_AA)

            # Draw label banner
            label = f"#{idx} {p_type.capitalize()} ({size_um:.1f}um, {conf:.2f})"
            (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)

            banner_y1 = max(0, y1 - th - 6)
            banner_y2 = y1
            cv2.rectangle(annotated, (x1, banner_y1), (x1 + tw + 8, banner_y2), color, -1)
            cv2.putText(
                annotated,
                label,
                (x1 + 4, banner_y2 - 3),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.45,
                (255, 255, 255),
                1,
                cv2.LINE_AA
            )

        return annotated


if __name__ == "__main__":
    from pathlib import Path
    sample_img_path = Path(__file__).resolve().parent.parent / "dataset" / "samples" / "demo_moderate_river_sample.png"

    if sample_img_path.exists():
        detector = MicroplasticDetector(confidence_threshold=0.5)
        raw_img = cv2.imread(str(sample_img_path))
        results = detector.detect(raw_img)
        print(f"Detection executed on demo sample:")
        print(f"  Total Particles Detected: {results['total_count']}")
        print(f"  Type Breakdown: {results['particle_type_summary']}")
        print(f"  Average Size: {results['average_size_um']} um")
    else:
        print(f"File not found: {sample_img_path}")
