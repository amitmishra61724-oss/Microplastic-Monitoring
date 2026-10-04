"""
Microscope Image Preprocessing Pipeline for Microplastic Particle Detection
Provides standard image enhancement, noise filtration, illumination correction,
and optical calibration conversions for laboratory microscope captures.
"""

import cv2
import numpy as np
from typing import Tuple, Dict, Any, Optional

class MicroscopePreprocessor:
    """
    Standard optical microscope preprocessing pipeline:
    - CLAHE (Contrast-Limited Adaptive Histogram Equalization)
    - Background illumination normalization / condenser correction
    - Edge-preserving denoising (Bilateral filtering)
    - Pixel-to-micrometer physical scale calibration
    """

    def __init__(self, default_pixel_scale_um: float = 1.25):
        """
        :param default_pixel_scale_um: Micrometers per pixel (e.g. 1.25 um/pixel at 10x objective).
        """
        self.pixel_scale_um = default_pixel_scale_um
        self.clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))

    def set_optical_magnification(self, objective: str):
        """
        Standard objective magnification scale lookup:
        - 4x:   3.125 um/pixel
        - 10x:  1.25 um/pixel
        - 20x:  0.625 um/pixel
        - 40x:  0.3125 um/pixel
        - 100x: 0.125 um/pixel
        """
        magnification_map = {
            "4x": 3.125,
            "10x": 1.25,
            "20x": 0.625,
            "40x": 0.3125,
            "100x": 0.125
        }
        if objective in magnification_map:
            self.pixel_scale_um = magnification_map[objective]
        return self.pixel_scale_um

    def pixels_to_micrometers(self, px_dim: float) -> float:
        """Convert pixel dimension to micrometers."""
        return round(float(px_dim * self.pixel_scale_um), 2)

    def micrometers_to_pixels(self, um_dim: float) -> float:
        """Convert micrometer dimension to pixels."""
        return float(um_dim / self.pixel_scale_um)

    def enhance_contrast(self, image_bgr: np.ndarray) -> np.ndarray:
        """
        Apply CLAHE in LAB color space (L channel only)
        to prevent color distortion while dramatically boosting particle visibility.
        """
        lab = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        enhanced_l = self.clahe.apply(l)
        enhanced_lab = cv2.merge((enhanced_l, a, b))
        return cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)

    def correct_illumination(self, image_bgr: np.ndarray) -> np.ndarray:
        """
        Estimate background lighting gradient using a large Gaussian blur kernel
        and normalize condenser brightness variance across the microscope field.
        """
        gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
        # Background estimation with large kernel
        bg = cv2.GaussianBlur(gray, (101, 101), 0)
        # Difference from background
        diff = cv2.subtract(bg, gray)
        # Normalize
        norm = cv2.normalize(diff, None, alpha=0, beta=255, norm_type=cv2.NORM_MINMAX, dtype=cv2.CV_8U)
        return norm

    def denoise(self, image_bgr: np.ndarray) -> np.ndarray:
        """
        Bilateral filter to smooth fluid grain while preserving sharp particle boundaries.
        """
        return cv2.bilateralFilter(image_bgr, d=7, sigmaColor=50, sigmaSpace=50)

    def process(self, image_bgr: np.ndarray) -> Dict[str, Any]:
        """
        Full standardized pipeline execution returning enhanced image and analysis artifacts.
        """
        denoised = self.denoise(image_bgr)
        enhanced = self.enhance_contrast(denoised)
        illum_corrected = self.correct_illumination(enhanced)

        return {
            "preprocessed_bgr": enhanced,
            "illumination_corrected_gray": illum_corrected,
            "pixel_scale_um": self.pixel_scale_um
        }


if __name__ == "__main__":
    import sys
    from pathlib import Path

    sample_dir = Path(__file__).resolve().parent.parent / "dataset" / "samples"
    test_img_path = sample_dir / "demo_low_lake_water.png"

    if test_img_path.exists():
        img = cv2.imread(str(test_img_path))
        preprocessor = MicroscopePreprocessor()
        results = preprocessor.process(img)
        print(f"Preprocessing test successful! Output shape: {results['preprocessed_bgr'].shape}")
    else:
        print(f"Sample image not found at {test_img_path}")
