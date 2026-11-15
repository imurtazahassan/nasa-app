# EarthPulse — Satellite data, in plain language

Built for the **NASA International Space Apps Challenge 2026** (*Earth Observation for Local Community Resilience*).

EarthPulse translates petabytes of open NASA satellite telemetry and global hydro-meteorological models into immediate, plain-language local decisions for **Farmers**, **Hikers**, **Emergency Responders**, and **Urban Planners**—with an interactive **Leaflet + NASA GIBS 2D Satellite Map**, a **Three.js 3D Terrain & Orbit scene**, full **English & Urdu (RTL)** support, server-side Gemini 2.5 Flash grounded briefs/Q&A, and resilient offline fallbacks.

## NASA & Partner Data Sources

| Domain | Source / Spacecraft & Instrument | Spatial Resolution | Update Cadence |
| :--- | :--- | :--- | :--- |
| True Color & Thermal Imagery | NASA GIBS WMTS (`Suomi NPP VIIRS` / `MODIS Terra` fallback) | 250 m – 375 m | Daily (UTC) |
| Active Fire Points | NASA FIRMS (`VIIRS_SNPP_NRT`, optional `MAP_KEY`) + GIBS Thermal | 375 m | Near Real-Time (< 3 hr) |
| Natural Hazard Events | NASA EONET v3 (`wildfires`, `floods`, `severeStorms`, `landslides`) | Event-level | Continuous |
| Precipitation & Soil Moisture | NASA POWER (`MERRA-2` / `GPM IMERG` `PRECTOTCORR`, `GWETROOT`, `T2M_MAX`) | 0.5° × 0.625° | Daily (2–4 day lag) |
| IMERG Precipitation Overlay | NASA GIBS GPM `IMERG_Precipitation_Rate` | 0.1° | 30 min – Daily |
| Weather & Air Quality | Partner Data · Open-Meteo Forecast & CAMS Air Quality (`US AQI`, `PM2.5`) | 11 km – 40 km | Hourly / Daily |
| River Discharge & Floods | Partner Data · Open-Meteo Global Flood (`GloFAS` v4) | 0.05° | Daily |
| 3D Terrain Elevation | Copernicus DEM 90m (via Open-Meteo Elevation API) | 90 m | Static DEM |

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser. Optionally copy `.env.example` to `.env` and add:
- `GEMINI_API_KEY`: Server-side Gemini API key (`gemini-2.5-flash`) used by `/api/gemini/brief` and `/api/gemini/chat` for plain-language Situation Briefs and grounded Q&A. Without a key, EarthPulse automatically runs its deterministic offline briefing engine.
- `FIRMS_MAP_KEY`: Server-side NASA FIRMS `MAP_KEY` used by `/api/firms` to serve 375m VIIRS active fire point CSV overlays to all visitors automatically (or visitors can supply a personal key inside **Mission & Methods**).

## Push to GitHub & Deploy on Vercel

EarthPulse includes `vercel.json` and Vercel Serverless Functions under `/api/` so both the Vite frontend and server-side `/api/gemini/*` and `/api/firms` endpoints deploy seamlessly:

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial EarthPulse commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/earthpulse.git
   git push -u origin main
   ```
2. **Import into Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new) and import your `earthpulse` GitHub repository.
   - Keep **Framework Preset: Vite**, **Build Command: `npm run build`**, **Output Directory: `dist`**.
3. **Add Server Environment Variables:**
   - In **Vercel Project Settings → Environment Variables**, add `GEMINI_API_KEY` (and optionally `FIRMS_MAP_KEY`) so your keys stay strictly server-side.
4. **Continuous Deployment:**
   - Click **Deploy**. Every subsequent `git push` to `main` (or pull request) automatically builds and updates your live Vercel URL.

---

*Built for the NASA Space Apps Challenge 2026 · Open NASA & Partner Telemetry · Not an official NASA product.*
