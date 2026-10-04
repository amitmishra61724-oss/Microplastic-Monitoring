# Functional Design Specification (FDS)

## 1. Scope & Objective
Automate the quantification, physical measurement, polymer classification, and regulatory risk scoring of microplastic particles (&lt; 5mm) in water samples from microscope optical imaging.

---

## 2. Functional Requirements

### FR-01: Sample Management
- Record sample code identifiers, collection location, volume in mL, sampling notes, and timestamps.
- Ensure sample volume $V > 0$ mL.

### FR-02: Microscope Image Ingestion
- Accept high-resolution optical microscope imagery in PNG, JPEG, TIFF, and BMP formats.
- Support objective magnification presets: 4x (3.125 &micro;m/px), 10x (1.25 &micro;m/px), 20x (0.625 &micro;m/px), 40x (0.3125 &micro;m/px), 100x (0.125 &micro;m/px).

### FR-03: AI Particle Detection & Characterization
- Automatically segment microplastic particles from fluid medium.
- Extract bounding box coordinates $[x_{\min}, y_{\min}, x_{\max}, y_{\max}]$, confidence score ($0.0 \sim 1.0$), and calibrated physical dimension in micrometers ($\mu\text{m}$).
- Classify particles into 5 standard morphology classes: Fiber, Fragment, Pellet, Film, Sphere.

### FR-04: Concentration Calculation & Risk Scoring
- Calculate standardized microplastic concentration:
  $$\text{Concentration (particles/L)} = \frac{\text{Total Detected Particle Count}}{\text{Volume (mL)} / 1000}$$
- Classify contamination tier based on environmental thresholds:
  - **LOW Risk:** &lt; 10.0 particles/L
  - **MODERATE Risk:** 10.0 &ndash; 50.0 particles/L
  - **HIGH Risk:** &gt; 50.0 particles/L

### FR-05: Audit & Compliance Reporting
- Generate formatted JSON and CSV laboratory compliance reports containing sample details, aggregate results, and granular particle rosters.
