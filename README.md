# AI-Based Microplastic Monitoring System

> **Development Status:** Phase 0 — Project Foundation Complete  
> **Disclaimer:** The AI detection model and computer vision inference pipeline are **NOT** trained or integrated yet in Phase 0. Standardized interfaces and database schemas have been created to support integration in future phases.

---

## 1. Problem Statement
Microplastics (< 5mm synthetic polymer particles) represent an alarming aquatic environmental contaminant. Traditional manual microscope counting of microplastics is labor-intensive, slow, prone to human error, and inconsistent across laboratory operators.

---

## 2. Proposed Solution
An automated, AI-powered full-stack monitoring application that ingests optical microscope images of water samples, detects and counts microplastic particles, calculates concentration in **particles per liter (particles/L)**, classifies contamination levels against configurable standards, and presents analytical insights via an interactive dashboard.

---

## 3. System Flow Pipeline

```
Microscope Image
→ Upload
→ Image Preprocessing
→ AI Detection
→ Particle Counting
→ Concentration (particles/L)
→ Contamination Classification
→ Database
→ Dashboard
```

---

## 4. AI & Computer Vision Strategy
* Object detection architecture (PyTorch / Ultralytics YOLO-compatible).
* Bounding box localization (`x_min`, `y_min`, `x_max`, `y_max`) and particle confidence scoring (`0.0` to `1.0`).
* Particle concentration formula:
  $$\text{concentration\_particles\_per\_liter} = \frac{\text{total\_particle\_count}}{\text{volume\_ml} / 1000}$$
* *Note: Thresholds (`LOW_CONCENTRATION_THRESHOLD`, `HIGH_CONCENTRATION_THRESHOLD`) are configurable provisional environment settings and are not scientifically validated standard values at this stage.*

---

## 5. Functional Design Specification (FDS) Usage
* **Sample Management:** Track water sample collection volume, date, location, and metadata.
* **Image Upload & Analysis:** Form API for microscope image submission and automated pipeline triggering.
* **Persistence:** Relational model storing granular particle detections, aggregate sample analyses, and raw image metadata.
* **Dashboard & Metrics:** Real-time visibility into microplastic concentration and historical trends.

---

## 6. Software Engineering & Project Management (SEPM) Usage
* **Modular Layered Architecture:** Decoupled frontend, FastAPI backend, PostgreSQL database, and machine learning components.
* **Containerization & Reproducibility:** Multi-container Docker Compose orchestration for local development and deployment.
* **Testing & Quality Assurance:** Pytest automated backend schema/endpoint testing and TypeScript build verification.

---

## 7. Technology Stack
* **Backend:** Python 3.11+, FastAPI, SQLAlchemy, Pydantic v2
* **Frontend:** React 18+, TypeScript, Vite, React Router DOM
* **Database:** PostgreSQL 16
* **Containerization:** Docker & Docker Compose
* **Testing:** Pytest, HTTPX

---

## 8. Project Phases
- [x] **Phase 0 — Project Foundation:** Software architecture, clean directory structure, FastAPI backend scaffold, React+TS frontend scaffold, PostgreSQL Docker configuration, database models, schema validations, and initial test suite.
- [ ] **Phase 1 — Data Acquisition & Preprocessing Pipeline**
- [ ] **Phase 2 — AI Model Development & Training**
- [ ] **Phase 3 — System Integration & Analytics Pipeline**
- [ ] **Phase 4 — Dashboard & Visualization Enhancements**
- [ ] **Phase 5 — Validation, Testing & Documentation**

---

## 9. Quickstart / Running Locally

### Prerequisites
* Docker & Docker Compose OR Python 3.11+ and Node.js 18+

### Running with Docker Compose
```bash
docker-compose up --build
```
* **Frontend Dashboard:** http://localhost:5173
* **Backend API Docs:** http://localhost:8000/docs
* **Health Check:** http://localhost:8000/health

### Running Backend Locally
```bash
cd backend
python -m venv venv
# On Windows:
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Running Backend Tests
```bash
cd backend
pytest
```

### Running Frontend Locally
```bash
cd frontend
npm install
npm run dev
```
