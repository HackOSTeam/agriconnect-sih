# KisanRoute AI — Intelligent Agri-Logistics Route Optimization Platform

> **Smart India Hackathon (SIH) 2026 Problem Statement 33 (SIH26033)**  
> Production-grade Multi-Stop Farm-to-Buyer Vehicle Route Optimization, Real-Road Navigation & Driver Dispatching Engine.

---

## 🚀 Quickstart Guide

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Launch the Web Application & API
```bash
python -m uvicorn api.app:app --reload --port 8000
```
Open your browser at **[http://localhost:8000](http://localhost:8000)** to interact with the full dashboard!

- **Interactive UI**: `http://localhost:8000/`
- **Swagger REST API Docs**: `http://localhost:8000/docs`

### 3. Run Automated Unit Tests
```bash
pytest tests/
```

### 4. Run CLI Demo (Optional)
```bash
python run_demo.py
```

---

## 📚 Repository Structure & Tour

```
c:\SIH 2026\
├── api/
│   └── app.py                     # [THE WAITER] FastAPI REST Server (serves UI & /api/v1/optimize)
├── src/
│   └── route_optimizer/
│       ├── models.py              # [THE RULEBOOK] Data Schemas & Pydantic Models
│       ├── matching.py            # [THE MATCHMAKER] Supply-Demand Allocation Engine
│       ├── matrix.py              # [THE MAP EXPERT] OSRM Real Road Matrix & Polyline Fetcher
│       ├── solver.py              # [THE AI BRAIN] Google OR-Tools PDP-VRPTW Constraint Engine
│       ├── kpis.py                # [THE ACCOUNTANT] Cost, Fuel & Distance Savings Calculator
│       └── visualization.py       # [THE PAINTER] Folium Interactive Map Renderer
├── ui/
│   ├── index.html                 # [THE BROWSER VIEW] Ultra-Dark Glassmorphism Dashboard
│   ├── style.css                  # [THE STYLING] Design System & Micro-animations
│   └── app.js                     # [THE CONTROLLER] Leaflet Map & API Integration logic
├── data/
│   └── sample_payload.json        # [SAMPLE DATA] Default Pune Agro-Cluster test payload
├── tests/
│   └── test_optimizer.py          # [TEST SUITE] Automated Pytest suite (6/6 passing)
├── EXPLANATION_GUIDE.md           # [MASTER GUIDE] 10-Year-Old Explanation & SIH Judge Viva Shield
├── README.md                      # [THIS FILE] Quickstart overview
├── requirements.txt               # [DEPENDENCIES] Python packages
└── run_demo.py                    # [CLI RUNNER] Terminal execution demo
```

---

## 💡 Complete Viva & Presentation Guide

For the **10-year-old analogy**, **file-by-file code guide**, **map API key integration**, and **15 winning answers to brutal SIH judge questions**, refer to:

👉 **[EXPLANATION_GUIDE.md](EXPLANATION_GUIDE.md)**
