# Testing & Verification Strategy

## 1. Quality Assurance Suite

### 1.1 Backend Automated Tests (Pytest)
Execute with:
```bash
cd backend
python -m pytest
```
- **Schema Validation Tests (`tests/test_schemas.py`):**
  - Boundary checking on sample volume ($> 0$), particle bounding box coordinate order ($x_{\max} \ge x_{\min}$, $y_{\max} \ge y_{\min}$), confidence range ($[0.0, 1.0]$), and non-negative particle counts.
- **Health Check Tests (`tests/test_health.py`):**
  - Verify `/health` and `/api/v1/health` return active status and `ai_model_integrated: true`.
- **API Integration Tests (`tests/test_api.py`):**
  - Complete sample CRUD lifecycle (Create, Read, Search, Delete).
  - Demo sample analysis execution (`/api/v1/analysis/analyze-demo`).
  - Image multipart upload and automated detection execution (`/api/v1/analysis/upload`).
  - Concentration calculation verification in particles/L.
  - Audit report generation in JSON and CSV formats.
  - Dashboard analytics KPI calculation (`/api/v1/analytics/summary`).

**Result:** 18 passing test cases across all modules.

---

## 2. Machine Learning Model Benchmark

Run evaluation over the held-out test split:
```bash
python ml/scripts/train_eval.py
```
- **Test Dataset:** 5 optical microscope test captures containing 59 ground-truth microplastic annotations.
- **Performance Metrics:**
  - Precision: **61.04%**
  - Recall: **79.66%**
  - F1-Score: **69.12%**
  - mAP@0.5: **66.35%**

---

## 3. Frontend TypeScript Compilation
Run type checking and production build:
```bash
cd frontend
npm run build
```
**Result:** 1,466 modules transformed, production assets generated cleanly in `dist/` with 0 warnings/errors.
