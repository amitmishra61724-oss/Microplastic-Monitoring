# Dataset Guidelines & Specification

## Overview
This directory structure holds datasets for training and evaluating microplastic detection models in future phases.

> **Note:** Raw binary image datasets, label files, and trained model weights MUST NOT be committed to Git version control. Use `.gitignore` to prevent tracking binary assets.

---

## 1. Directory Structure

```
ml/dataset/
├── images/
│   ├── train/
│   ├── val/
│   └── test/
├── labels/
│   ├── train/
│   ├── val/
│   └── test/
└── README.md
```

---

## 2. Image Format Expectations
* **Formats:** PNG, JPEG, TIFF (high-resolution microscope imaging)
* **Color Space:** RGB / Grayscale
* **Resolution:** Standardized minimum resolution of 1024x1024 (or raw optical capture dimensions)
* **Metadata:** File names should correlate with sample reference identifiers where applicable.

---

## 3. Annotation Format
* **Format:** YOLO standard format (`.txt` per image) or COCO JSON.
* **Bounding Box Format (Normalized):**
  `<class_id> <x_center> <y_center> <width> <height>`
  where coordinate values are normalized between `0.0` and `1.0`.
* **Classes:**
  - `0`: Microplastic Particle (Fibre, Fragment, Pellet, Film, Sphere)

---

## 4. Dataset Split Strategy
* **Train Set:** 70% of collected microscope images
* **Validation Set:** 20% for hyperparameter tuning & validation metrics
* **Test Set:** 10% held-out test evaluation set

---

## 5. Dataset Provenance
* Specific dataset sources, sample preparation protocols, and imaging equipment specifications will be formally documented in **Phase 1 (Data Acquisition & Preprocessing)**.
