# Microplastic Monitoring System Architecture

## 1. High-Level Architecture Overview

The system follows a modern, decoupled layered microservices architecture:

```
[ Frontend: React 18 + TS + Vite ]
               │
               │ HTTP / JSON / Multipart
               ▼
[ Backend: FastAPI REST Services ]
       │                   │
       ▼                   ▼
[ PostgreSQL 16 ]    [ AI Computer Vision Engine: OpenCV & Morphology ]
       │                   │
  Relational           Particle Localization,
  Persistence          Classification & Sizing (µm)
```

---

## 2. Core Subsystems

### 2.1 Frontend Presentation Tier (Vite / React 18 / TypeScript)
- **Surveillance Dashboard:** Live KPI cards, contamination risk distributions, polymer morphology distribution charts, and recent activity feed.
- **Microscope Image Analysis Tool:** Drag-and-drop microscope imagery, 1-click curated benchmark sample testing, optical objective magnification calibration (4x–100x), scanning radar animation, and interactive dual-mode inspection visualizer (Annotated vs. Raw).
- **Water Sample Management:** Catalogue of collected water bodies, sample volumes in mL, locations, and inspection history.
- **Analysis History Archive:** Searchable, filterable audit log with inspect modal, and laboratory compliance report downloads (CSV/JSON).

### 2.2 Backend Application Tier (FastAPI / SQLAlchemy / Pydantic v2)
- **API Endpoints:**
  - `/api/v1/health`: System health and AI detector integration status.
  - `/api/v1/samples`: CRUD operations for water collection samples.
  - `/api/v1/analysis/upload`: Multipart microscope image ingestion & detection execution.
  - `/api/v1/analysis/analyze-demo`: Fast 1-click execution on preloaded benchmark captures.
  - `/api/v1/analysis/{id}/report`: Formatted JSON/CSV laboratory audit reports.
  - `/api/v1/analytics/summary`: Aggregate KPIs and distributions.
  - `/api/v1/demo/samples`: Curated optical microscope benchmark library.
- **Services Layer:**
  - `DetectionService`: Preprocessing, morphological segmentation, classification, sizing, concentration calculation, and bounding box rendering.
  - `SampleService`: Water sample registry logic.
  - `AnalyticsService`: Database metrics aggregation.

### 2.3 Machine Learning & Computer Vision Tier (`ml/`)
- **Preprocessing Pipeline:** Contrast-Limited Adaptive Histogram Equalization (CLAHE) in LAB color space, edge-preserving bilateral filtering, condenser illumination correction, and scale calibration.
- **Detector Engine:** Morphological invariant analysis (aspect ratio, circularity, solidity, extent, color variance) to detect and classify:
  - `fiber` (high aspect ratio filaments)
  - `fragment` (angular shards)
  - `pellet` (compact rounded virgin resin pellets)
  - `film` (translucent undulating membranes)
  - `sphere` (circular microbeads)
- **Non-Maximum Suppression (NMS):** Eliminates duplicate candidate bounding boxes.
- **Scale Calibration:** Optical magnification conversions to physical micrometers ($\mu\text{m}$).

### 2.4 Persistence Tier (PostgreSQL 16 / SQLite fallback)
- Relational schema modeling `Sample`, `AnalysisResult`, `DetectedParticle`, and `ImageMetadata` with foreign key cascade relationships.
