# System Architecture & Flow Specification

## High-Level System Flow

```
Microscope Image
    │
    ▼
Upload (REST API / FastAPI)
    │
    ▼
Image Preprocessing (OpenCV filter / normalization stubs)
    │
    ▼
AI Detection (YOLO / PyTorch - Model Interface Stub*)
    │
    ▼
Particle Counting (Sum of detected bounding boxes)
    │
    ▼
Concentration (particles/L)  [formula: total_particles / (volume_ml / 1000)]
    │
    ▼
Contamination Classification (Provisional Threshold evaluation)
    │
    ▼
Database (PostgreSQL persistence)
    │
    ▼
Dashboard (React + TypeScript visualization)
```

> **IMPORTANT DISCLAIMER:**
> *The AI detection model and computer vision inference pipeline are NOT trained or integrated in Phase 0. The current architecture defines clean API endpoints, database entities, and modular service stubs designed for seamless model integration in Phase 2.*

---

## Data Pipeline Details

### 1. Microscope Image & Upload
- Optical microscope images of water samples are uploaded via REST API multi-part form endpoint.
- File metadata (file size, mime type, dimensions `width` and `height`) is extracted and persisted in `image_metadata`.

### 2. Image Preprocessing (Phase 1/2)
- Standardization of dimensions, contrast enhancement, noise reduction, and channel normalization.

### 3. AI Detection & Particle Counting
- Target detection pipeline identifies bounding boxes (`x_min`, `y_min`, `x_max`, `y_max`), particle classification types, and detection `confidence` scores (range 0.0 to 1.0).
- Total count is evaluated by aggregating detected bounding boxes per image sample.

### 4. Concentration Estimation
- Calculated strictly in **particles per liter (particles/L)** using sample volume:
  $$\text{concentration\_particles\_per\_liter} = \frac{\text{total\_particle\_count}}{\text{volume\_ml} / 1000}$$

### 5. Contamination Classification
- Evaluated against provisional environment configuration thresholds (`LOW_CONCENTRATION_THRESHOLD`, `HIGH_CONCENTRATION_THRESHOLD`).
- Output classification options: `LOW`, `MEDIUM`, `HIGH` (stored as nullable until validated against reference standards).

### 6. Persistence & Presentation
- Storage of analysis results, metadata, and detected particles in PostgreSQL.
- Real-time updates pushed to the React + TypeScript frontend dashboard for analytical review.
