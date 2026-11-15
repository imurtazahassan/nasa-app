# EarthPulse — NASA International Space Apps Challenge 2026
## Complete Production Specification for Google AI Studio & Free Vercel Deployment

---

### 0. ROLE & EXECUTION DIRECTIVE
You are a principal full-stack engineer, geospatial systems architect, and product designer building an award-caliber submission for the **NASA International Space Apps Challenge 2026**.

**Execution Rules (Mandatory):**
1. **Single-Pass Complete Build:** Generate the entire application end-to-end in one cohesive pass. Do **not** ask clarifying questions, do **not** leave `TODO` comments, do **not** use placeholder copy ("lorem ipsum"), and do **not** stub out handlers.
2. **Zero-Cost Static Hosting Ready (Vercel / Netlify / Cloudflare Pages):** The application must run 100% client-side in the browser with **no custom backend server** and **no paid database**. Include a valid `vercel.json` for single-page application routing, an `.env.example` file, and a `README.md` with step-by-step free Vercel deployment instructions.
3. **Dual Environment Key Compatibility:** Resolve the Gemini API key cleanly across both Google AI Studio and Vercel static builds using:
   `const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env?.API_KEY : '') || '';`
   If no API key is configured at runtime, the app must **never crash**—it must automatically switch to its deterministic offline briefing engine and display a subtle `"Offline Rule-Based Brief"` badge.

---

### 1. PRODUCT VISION & COMPETITION FRAMING
- **Application Name:** `EarthPulse`
- **Tagline:** `"Satellite data, in plain language."`
- **Core Problem:** NASA's Earth-observing satellites produce petabytes of open wildfire, flood, precipitation, and soil moisture telemetry every day, yet farmers, hikers, urban planners, and local emergency responders lack a fast, plain-language decision tool that translates orbital measurements into immediate local actions.
- **Official Challenge Addressed:** `[PASTE OFFICIAL 2026 CHALLENGE TITLE]` *(Note to builder: If this bracketed placeholder is left unedited, frame the app around `"NASA Space Apps Challenge 2026: Earth Observation for Local Community Resilience"` without inventing a fake official sub-challenge title.)*
- **The 5-Second Core Promise:** Within 5 seconds of opening, any user sees whether an environmental hazard near them is urgent today, which NASA satellite or partner model detected it, and what concrete action to take next.
- **Target Personas:**
  1. **Farmer** (Crop irrigation, planting/harvest timing, soil moisture & rainfall outlook)
  2. **Hiker / Outdoor Citizen** (Trail wildfire smoke, flash-flood risk, heat exposure)
  3. **Emergency Responder** (Tactical hazard prioritization, exact distance/bearing to active detections)
  4. **Urban Planner** (30-day rolling climate/air trends, heat-island & flood drainage exposure)
- **Default Configuration:**
  - **Default Location:** Rawalpindi, Punjab, Pakistan (`33.5651° N, 73.0169° E`, Timezone: `Asia/Karachi`)
  - **Default Search Radius:** `50 km` (Options: `25 km`, `50 km`, `100 km`)
  - **Default Language:** English (`en`), with instant full Urdu (`ur`) RTL mirroring
  - **Default Theme:** Automatically follows system `prefers-color-scheme`, toggleable between Dark and Light modes

---

### 2. DESIGN SYSTEM: "MODERN AEROSPACE TELEMETRY"
Combine the disciplined clarity of **NASA Mission Control** with **modern high-craft SaaS UI** (crisp card elevation, hairline borders, subtle frosted map HUD overlays, `Cmd+K` / `/` quick place search, and razor-sharp tabular telemetry).

- **Visual Guardrails:**
  - Strictly **NO** cheesy sci-fi neon glow, **NO** rainbow gradients, and **NO** emojis anywhere in the UI (use crisp geometric `lucide-react` icons exclusively).
  - **NASA Brand Compliance:** Do **NOT** render the NASA "meatball" or "worm" logos, and never imply official NASA endorsement. Include a persistent subtle footer: `"Built for the NASA Space Apps Challenge 2026 • Open NASA & Partner Telemetry • Not an official NASA product."`

- **Color Tokens (`src/index.css` CSS Custom Properties):**
  - **Orbital Night (Dark Theme):**
    - `--bg`: `#070D19` (Deep orbital canvas)
    - `--surface`: `#0E1729` (Primary card surface)
    - `--raised`: `#15223B` (Elevated controls / hover states)
    - `--hud`: `rgba(14, 23, 41, 0.88)` (Map floating HUD with `backdrop-filter: blur(12px)`)
    - `--line`: `#1E2F4D` (Crisp `1px` structural hairline border)
    - `--text`: `#F3F6FC` (Primary high-contrast ink)
    - `--muted`: `#94A6C4` (Secondary labels & metadata)
    - `--primary`: `#0B3D91` (NASA Heritage Blue)
    - `--interactive`: `#5B9BFF` (Interactive links, focus rings, active tabs)
    - `--accent-red`: `#FC3D21` (NASA Vermilion accent)
  - **Daylight Telemetry (Light Theme):**
    - `--bg`: `#F3F6FA` (Clean archival paper canvas)
    - `--surface`: `#FFFFFF` (Elevated card surface)
    - `--raised`: `#E9EEF5` (Subtle inset / hover surface)
    - `--hud`: `rgba(255, 255, 255, 0.90)` (Map floating HUD with `backdrop-filter: blur(12px)`)
    - `--line`: `#D4DCE8` (Crisp `1px` structural hairline border)
    - `--text`: `#0B192C` (Deep navy ink)
    - `--muted`: `#4E617D` (Secondary labels & metadata)
    - `--primary`: `#0B3D91` (NASA Heritage Blue)
    - `--interactive`: `#0B3D91` (Interactive links, focus rings, active tabs)
    - `--accent-red`: `#FC3D21` (NASA Vermilion accent)

- **Semantic Status System (Never conveyed by color alone—always render Geometric Icon + Status Word + Color):**
  - **Nominal:** `#10B981` (Emerald) + `CircleCheck` / `Circle` icon
  - **Watch:** `#F59E0B` (Amber) + `TriangleAlert` icon
  - **Warning:** `#F97316` (Tangerine) + `Diamond` icon
  - **Critical:** `#FC3D21` (NASA Vermilion) + `OctagonAlert` icon
  - **No Data / Offline:** `var(--muted)` + `MinusSquare` icon

- **Typography (`index.html` Google Fonts):**
  - **UI Sans:** `IBM Plex Sans` (weights `400, 500, 600, 700`), clean sentence case everywhere.
  - **Telemetry Monospace:** `IBM Plex Mono` (weights `400, 500, 600`) with `font-variant-numeric: tabular-nums` enforced on every numeric reading, coordinate, distance, bearing, resolution, and timestamp.
  - **Urdu Typography:** `Noto Naskh Arabic` (weights `400, 600, 700`) activated automatically when `lang="ur"`.
  - **Type Scale:** `12px` (micro metadata) / `14px` (body & controls) / `16px` (module titles) / `20px` (banner headline) / `30px` (primary KPI telemetry figure) / `40px` (hero summary). Keep prose paragraphs under `68ch`.

- **Shape, Elevation & Motion:**
  - Modern refined corners: `6px` border-radius on cards/panels, `4px` on buttons/inputs/badges, `9999px` pill radius only on compact map HUD chips.
  - `1px solid var(--line)` borders on all cards, paired with a `4px` status-colored leading accent bar (`border-inline-start`) on each hazard module.
  - Subtle `12px × 12px` SVG blueprint viewfinder brackets at the four corners of the satellite map frame.
  - **Motion Discipline:**
    - One signature orchestrated moment on initial load or location change: a sequential **"Telemetry Lock / Systems Check"** where the four hazard modules display `"Acquiring satellite stream…"` with a sleek `2px` animated progress bar and snap into their resolved status cards as each API settles.
    - All other micro-interactions (accordion expand, tab switch, drawer transition, hover states) must be crisp and `<= 180ms`. Honor `@media (prefers-reduced-motion: reduce)`.

---

### 3. RESPONSIVE WORKSPACE LAYOUT
- **Desktop (`>= 1024px`, locked `100dvh` viewport, no outer page scroll):**
  - **Top Command Bar (`56px` height):**
    - Left: `EarthPulse` wordmark + `"SPACE APPS 2026"` micro-badge.
    - Center: Global Place Search bar (`Cmd+K` / `/` shortcut) with `"Use My GPS"` button and saved-locations quick popover.
    - Right: Radius segmented control (`25` / `50` / `100 km`), Persona selector pill, Language toggle (`EN | اردو`), Theme toggle (`Sun / Moon`), `"Demo Scenarios"` menu, and `"Mission & Methods"` button.
  - **Left Telemetry Rail (`410px` fixed width, internal smooth scroll):**
    - Top: **Overall Status Banner** (highest-priority hazard for the active persona, geometric badge, plain-language summary sentence, local observation timestamp in target IANA timezone, and quick Share / Print actions).
    - Below: **Four Hazard Modules** stacked vertically with persona-specific contextual callouts.
  - **Center Earth Observation Viewport (`1fr` flexible width, full height):**
    - Interactive `react-leaflet` satellite map.
    - Top-left floating HUD: Active satellite layer indicator + coordinates readout (`lat, lon`).
    - Top-right floating HUD: Layer toggles (`True Color`, `Thermal Fires`, `IMERG Rain`, `EONET Events`, `Radius Ring`, `Street Base`).
    - Bottom floating HUD: **7-Day Satellite Imagery Date Scrubber** (`T-6` through `Today`) + screen-reader accessible table toggle.
  - **Right Intelligence Deck (`380px` fixed width, internal smooth scroll):**
    - Segmented tabs: **`Brief`** (AI Situation Brief), **`Ask`** (Grounded AI Chat), and **`Actions`** (Offline Persona Checklist).
    - Persistent safety disclaimer footer pinned cleanly at the bottom of the deck.

- **Mobile & Tablet (`< 1024px`):**
  - Compact sticky header (`Place Search` + `"Controls"` drawer trigger for Radius, Persona, Language, Theme, Demo Scenarios, and Mission & Methods).
  - Fixed bottom navigation dock (`60px` height, `>= 44px` touch targets) switching smoothly between **`Status`**, **`Map`**, **`Brief`**, and **`Ask`** views without losing state.

---

### 4. DETAILED FEATURE SPECIFICATIONS

1. **Place Search, GPS & Saved Locations:**
   - Debounced (`300ms`) geocoding input supporting `Cmd+K` / `/` keyboard focus, keyboard arrow navigation, and up to 5 structured results (`Name, Admin Region, Country` + `Lat/Lon`).
   - `"Use my location"` button calling `navigator.geolocation.getCurrentPosition` with clear error handling if permission is denied or unavailable.
   - Click/tap anywhere on the satellite map to drop an inspection pin and load telemetry for that exact coordinate.
   - Pin/save up to 5 favorite locations in `localStorage` (wrapped in safe `try/catch` storage helpers).

2. **Four Hazard Modules (`Wildfire`, `Flood Risk`, `Soil Moisture`, `Air Quality`):**
   - Each card renders:
     - Hazard title + geometric status badge (`Icon + Word`).
     - Primary KPI figure in `30px` tabular `IBM Plex Mono` + unit (e.g., `14.2 km`, `1.85×`, `0.34 m³/m³`, `118 US AQI`).
     - One plain-language interpretation sentence tailored to the metric.
     - Crisp `7-day` Recharts area/line sparkline (`ResponsiveContainer` with custom minimal tooltip).
     - Provenance row: Explicit instrument/source badge (e.g., `NASA VIIRS 375m`, `NASA POWER / MERRA-2`, `NASA EONET v3`, or `Partner Data • Open-Meteo`) + relative `"Updated"` timestamp + `"Stale"` badge if cache age exceeds $2 \times \text{TTL}$.
     - Expandable **`"Telemetry & Rule Breakdown"`** accordion displaying the exact raw inputs, observation dates, and the specific threshold rule that triggered the current status.

3. **Persona Intelligence System:**
   - **Farmer:** Orders modules `Soil Moisture → Flood Risk → Wildfire → Air Quality`. Adds an **Agronomic Callout Card** showing 14-day cumulative precipitation (`7d past + 7d forecast`) and practical field/irrigation guidance.
   - **Hiker:** Orders modules `Wildfire → Air Quality → Flood Risk (flash-flood caution) → Soil Moisture`. Adds a prominent **Thermal / Heat Exposure Badge** derived from forecasted `temperature_2m_max` / NASA POWER `T2M_MAX` (highlighting caution above $35^\circ\text{C}$ and danger above $40^\circ\text{C}$).
   - **Emergency Responder:** Orders modules strictly by highest severity (`Critical → Warning → Watch → Nominal`). Renders a **Tactical Incident List** of active detections/events inside the search radius with exact `km` distance and 16-point compass bearing (`N, NNE, NE...`).
   - **Urban Planner:** Displays a **30-Day Baseline Summary Strip** (total thermal detections within radius, count of days with $\text{US AQI} > 100$, and 30-day cumulative rainfall).

4. **Curated Offline Action Plans (`/src/content/actionPlans.ts`):**
   - Write practical, safety-first, role-specific action checklists for **every** combination of `Persona (4) × Hazard (4) × Status (Nominal, Watch, Warning, Critical)` in **both English and Urdu**.
   - Works 100% offline with zero AI dependency.

5. **Interactive Satellite Map (`react-leaflet` + `leaflet`):**
   - **Critical Vite Bundler Fix:** Do **NOT** use Leaflet's default PNG marker icons (which break in production Vite builds). Render all fire detections, EONET events, and the target crosshair pin using custom `L.divIcon` inline SVG markers.
   - **Base Layers:**
     - Primary: **NASA GIBS WMTS True Color** (`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_CorrectedReflectance_TrueColor/default/{YYYY-MM-DD}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`, `maxNativeZoom: 9`). Default the date scrubber to `Yesterday (UTC)` so today's incomplete orbital swath never shows blank grey tiles, and automatically fall back to `MODIS_Terra_CorrectedReflectance_TrueColor` on tile error.
     - Secondary / Toggleable Street Base: OpenStreetMap (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`).
   - **7-Day Date Scrubber:** Interactive timeline slider + step buttons (`T-6` to `Today`) updating the GIBS `{YYYY-MM-DD}` imagery layer in real time.
   - **Toggleable Overlays:**
     - **Active Fire Detections:** FIRMS point markers (sized/colored by FRP) + NASA GIBS Thermal Anomalies WMTS layer (`VIIRS_SNPP_Thermal_Anomalies_375m_All`, `GoogleMapsCompatible_Level8`, `.png`).
     - **NASA EONET Events:** Open wildfires, floods, severe storms, and landslides within `400 km` with rich popups (title, category, date, distance, link to NASA EONET source).
     - **Precipitation Rate:** NASA GIBS GPM IMERG WMTS layer (`IMERG_Precipitation_Rate`, `GoogleMapsCompatible_Level6`, `.png`).
     - **Search Radius Ring** (`25 / 50 / 100 km` geodesic circle) & **GIBS Reference Place Labels** (`Reference_Labels_15m`, `GoogleMapsCompatible_Level9`, `.png`).

6. **WhatsApp-Ready Share Alert & Printable Field Brief:**
   - **Share Alert:** Generates a concise, structured plain-text bulletin (Location + Coordinates, Local Time, Overall Status, Key Readings, Top 3 Actions, NASA/Partner Data Attribution + Safety Disclaimer). Uses `navigator.share` on mobile/supported browsers with instant clipboard copy + toast notification fallback.
   - **Printable Field Brief:** Includes a clean `@media print` stylesheet transforming the app into a high-contrast, ink-efficient 1-page briefing sheet with coordinates, status table, and action checklist.

7. **One-Click Judge Demo Scenarios:**
   - Live satellite/model APIs run by default. Include a `"Demo Scenarios"` menu with 4 realistic bundled telemetry fixtures so competition judges can test elevated multi-hazard alerts anytime:
     1. *Rawalpindi Monsoon Surge* (Flood Warning + Watch Soil Waterlogging)
     2. *Indus Valley River Flood Critical* (Flood Critical + EONET Flood Event)
     3. *Punjab Wheat Belt Drought Watch* (Soil Moisture Critical + Air Watch)
     4. *Margalla Hills Wildfire Alert* (Wildfire Warning + Smoke Air Watch)
   - Whenever a demo scenario is active, show a prominent top banner: **`"DEMO SCENARIO ACTIVE — SIMULATED TELEMETRY (NOT LIVE)"`** with a one-click **`"Switch to Live Satellite Data"`** button.

8. **Mission & Methods Drawer (2 Tabs for Judges & Users):**
   - **Tab 1 — Data & Methods:** Complete provenance table listing every metric, NASA spacecraft/instrument (`Suomi NPP VIIRS`, `GPM IMERG`, `NASA POWER / MERRA-2`, `NASA EONET v3`) vs. partner models (`Open-Meteo / GloFAS`), spatial resolution (`375 m`, `0.1°`, `0.5° × 0.625°`), update cadence, direct NASA documentation links, exact threshold tables, an optional input field to save a personal NASA FIRMS `MAP_KEY` in `localStorage`, and an explicit scientific disclaimer that thresholds are decision-support heuristics rather than official government warnings.
   - **Tab 2 — Space Apps 2026 Project Brief:** Concise overview of the challenge addressed, the last-mile communication gap solved, multi-sensor data fusion architecture, and offline/bilingual accessibility impact.

---

### 5. CLIENT-SIDE DATA LAYER & GEOSPATIAL MATH (`/src/services` & `/src/utils`)
- **HTTP Client (`/src/services/http.ts`):** Every API request uses `AbortController` (`12,000 ms` timeout), 1 automatic retry with `800 ms` backoff on network/5xx errors, and `Promise.allSettled` orchestration so a single upstream failure never blocks healthy modules.
- **Two-Tier Cache (`/src/utils/cache.ts`):** In-memory `Map` + `localStorage` with TTLs:
  - FIRMS: `30 min` | EONET: `30 min` | Air Quality: `30 min` | Forecast: `60 min` | Flood: `180 min` | NASA POWER: `360 min`
- **Endpoints (All Browser-CORS Safe):**
  1. **Geocoding:** `https://geocoding-api.open-meteo.com/v1/search?name={q}&count=5&language=en&format=json`
  2. **NASA FIRMS (Optional Key):** `https://firms.modaps.eosdis.nasa.gov/api/area/csv/{MAP_KEY}/VIIRS_SNPP_NRT/{west},{south},{east},{north}/2`
     - Read key from `import.meta.env.VITE_NASA_FIRMS_KEY` or `localStorage.getItem('earthpulse_firms_key')`. Parse CSV (`latitude, longitude, bright_ti4, acq_date, acq_time, confidence, frp`), discard `low` confidence rows, and use `frp` (MW) for intensity. If no key is provided or the request fails, seamlessly evaluate Wildfire risk from **NASA EONET wildfires + NASA GIBS Thermal Anomalies**, showing a clean info note (`"Using NASA EONET + GIBS Thermal layer (add optional FIRMS key in Methods for 375m CSV points)"`).
  3. **NASA EONET v3:** `https://eonet.gsfc.nasa.gov/api/v3/events?status=open&category=wildfires,floods,severeStorms,landslides` (extract latest geometry point and filter client-side within `400 km`).
  4. **NASA POWER Daily Point:** `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=PRECTOTCORR,GWETROOT,GWETTOP,T2M_MAX&community=AG&longitude={lon}&latitude={lat}&start={YYYYMMDD_30d_ago}&end={YYYYMMDD_today}&format=JSON` (convert `-999` sentinel values to `null`; display the actual latest valid observation date because POWER lags 2–4 days).
  5. **Open-Meteo Weather Forecast:** `https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&daily=precipitation_sum,temperature_2m_max&past_days=7&forecast_days=7&timezone=auto`
  6. **Open-Meteo Air Quality:** `https://air-quality-api.open-meteo.com/v1/air-quality?latitude={lat}&longitude={lon}&current=us_aqi,pm2_5,pm10&hourly=us_aqi&past_days=30&forecast_days=3&timezone=auto`
  7. **Open-Meteo Global Flood:** `https://flood-api.open-meteo.com/v1/flood?latitude={lat}&longitude={lon}&daily=river_discharge,river_discharge_mean,river_discharge_max&past_days=7&forecast_days=7`

- **Geospatial Math Helpers (`/src/utils/geo.ts`):**
  - Implement exact **Haversine distance** in kilometers ($R = 6371\text{ km}$):
    $$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$
  - Implement initial **forward compass bearing** ($0^\circ\text{–}360^\circ$ mapped to 16-point cardinal directions `N, NNE, NE, ...`) and **bounding-box calculation** `[west, south, east, north]` for a given center `(lat, lon)` and radius `km`.

---

### 6. DETERMINISTIC RISK ENGINE (`/src/risk/riskEngine.ts`)
Pure, side-effect-free TypeScript functions exporting all thresholds as named constants.
Severity rank: `Critical (4) > Warning (3) > Watch (2) > Nominal (1)`.
Each module evaluates all applicable rules and selects the **highest severity triggered** (if all inputs for a module are `null`, return status `"No data"`—never default missing data to `Nominal`):

1. **Wildfire Module:**
   - Let $d$ = distance (`km`) to nearest credible thermal detection or open EONET wildfire event:
     - `Critical`: $d < 5\text{ km}$
     - `Warning`: $5\text{ km} \le d < 15\text{ km}$
     - `Watch`: $15\text{ km} \le d < 50\text{ km}$
     - `Nominal`: $d \ge 50\text{ km}$ or none within radius
   - **Cluster Escalation Rule:** Escalate severity by `+1` level (capped at `Critical`) if $\ge 10$ credible detections fall within `25 km`.

2. **Flood Risk Module:**
   - Evaluate the worst of four rules:
     - **River Discharge Ratio** $r = \frac{\text{forecast\_max}}{\text{discharge\_mean}}$: `Watch` if $r \ge 1.3$, `Warning` if $r \ge 2.0$, `Critical` if $r \ge 3.0$.
     - **Trailing 7-Day Cumulative Rainfall:** `Watch` $\ge 50\text{ mm}$, `Warning` $\ge 100\text{ mm}$, `Critical` $\ge 200\text{ mm}$.
     - **Next 3-Day Forecast Rainfall:** `Watch` $\ge 50\text{ mm}$, `Warning` $\ge 100\text{ mm}$.
     - **Proximity Override:** Any open NASA EONET `floods` or `severeStorms` event within `100 km` enforces at least `Warning`.

3. **Soil Moisture Module (`GWETROOT`, `0.00–1.00` root-zone wetness):**
   - `Nominal`: $0.40 < \text{value} \le 0.90$
   - `Watch`: $0.25 \le \text{value} \le 0.40$ (drying trend) **OR** $\text{value} > 0.90$ (waterlogging risk)
   - `Warning`: $0.15 \le \text{value} < 0.25$ (agricultural stress)
   - `Critical`: $\text{value} < 0.15$ (severe drought)

4. **Air Quality Module (`US AQI`):**
   - `Nominal`: $0 \le \text{AQI} \le 100$
   - `Watch`: $101 \le \text{AQI} \le 150$
   - `Warning`: $151 \le \text{AQI} \le 200$
   - `Critical`: $\text{AQI} > 200$

5. **Overall Status:** Highest severity across the active persona's prioritized modules.

---

### 7. GROUNDED AI INTELLIGENCE LAYER (`@google/genai`)
- **SDK & Model:** Use the official `@google/genai` package (`import { GoogleGenAI, Type } from "@google/genai"`) calling `gemini-2.5-flash`.
- **Situation Brief (`/src/services/gemini.ts`):**
  - Send a compact JSON telemetry snapshot (place name, coordinates, local time, persona, language, module statuses, exact numeric readings, units, as-of timestamps, data sources, and nearby EONET/FIRMS counts).
  - Request structured JSON output via `responseMimeType: "application/json"` and `responseSchema`:
    ```ts
    {
      type: Type.OBJECT,
      properties: {
        headline: { type: Type.STRING, description: "Max 12 words plain-language headline" },
        summary: { type: Type.STRING, description: "Max 60 words grounded strictly in the telemetry snapshot" },
        topActions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 short actionable imperatives" },
        dataGaps: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Any missing or lagged data sources" }
      },
      required: ["headline", "summary", "topActions", "dataGaps"]
    }
    ```
  - Set `temperature: 0.2` and respond strictly in the active UI language (`English` or `Urdu`).
- **Strict Anti-Hallucination System Instruction:**
  - Cite **only** numbers explicitly present in the provided JSON telemetry snapshot.
  - Never invent statistics or state future weather with absolute certainty.
  - Provide zero medical or legal diagnoses.
  - Explicitly instruct users to follow official local emergency authorities whenever status is `Warning` or `Critical`.
- **Ask EarthPulse Chat:**
  - Grounded Q&A scoped strictly to the active telemetry snapshot.
  - Provide 4 one-tap suggested questions tailored to the active persona.
  - Politely refuse off-topic requests and redirect back to local environmental telemetry.
  - Display `"Grounded in telemetry as of {localTime}"`.
- **Resilient Offline Fallback:** If no API key is present or Gemini fails/times out (`> 10s`), immediately assemble a clean deterministic brief from the active metrics and `actionPlans.ts` so the UI never shows a broken error box.
- **Persistent Safety Footer:** `"Informational decision-support only, not an official government warning. Follow local authorities."` Dynamically append `"Emergency: Rescue 1122"` when the selected coordinates fall inside Pakistan (`lat 23.5–37.2, lon 60.8–77.8`), or `"Contact your local emergency number"` elsewhere.

---

### 8. BILINGUAL & RTL ENGINE (`/src/i18n/translations.ts`)
- Complete typed dictionary for English (`en`) and Urdu (`ur`).
- Switching to Urdu sets `document.documentElement.dir = "rtl"` and `document.documentElement.lang = "ur"`.
- Use CSS logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`, `border-s-4`, `start-*`, `end-*`) across all components so layouts mirror cleanly in RTL.
- Explicitly apply `dir="ltr"` on numeric telemetry values, coordinates, Sparkline charts, and the Leaflet map wrapper so map tiles and tabular figures never invert.
- Format all numbers and timestamps with `Intl.NumberFormat` and `Intl.DateTimeFormat` using the target location's IANA timezone.

---

### 9. FREE VERCEL DEPLOYMENT & PROJECT STRUCTURE
Configure the repository so the user can export it from Google AI Studio, push to GitHub, and deploy to **Vercel (Hobby Free Tier)** in under 2 minutes with zero configuration errors:

- **`vercel.json` (Include in project root):**
  ```json
  {
    "$schema": "https://openapi.vercel.sh/vercel.json",
    "framework": "vite",
    "buildCommand": "npm run build",
    "outputDirectory": "dist",
    "rewrites": [
      { "source": "/(.*)", "destination": "/index.html" }
    ]
  }
  ```
- **`.env.example` (Include in project root):**
  ```env
  # Optional: Enables Gemini AI Situation Brief & Ask EarthPulse Chat (App runs offline fallback if omitted)
  VITE_GEMINI_API_KEY=

  # Optional: Free NASA FIRMS MAP_KEY from https://firms.modaps.eosdis.nasa.gov/api/area/
  VITE_NASA_FIRMS_KEY=
  ```
- **`vite.config.ts`:** Configure `manualChunks` separating `leaflet`/`react-leaflet` and `recharts` into async vendor chunks so initial bundle size remains fast.
- **`README.md`:** Include a clear project overview, NASA data attribution table, local dev setup (`npm install && npm run dev`), and a 3-step guide to deploying free on Vercel (`Import Git Repository -> Add VITE_GEMINI_API_KEY -> Deploy`).

- **Clean Modular Directory Structure:**
  - `/src/types/telemetry.ts`
  - `/src/services/` (`http.ts`, `geocoding.ts`, `firms.ts`, `eonet.ts`, `power.ts`, `weather.ts`, `airQuality.ts`, `flood.ts`, `gemini.ts`)
  - `/src/risk/riskEngine.ts`
  - `/src/content/` (`actionPlans.ts`, `demoScenarios.ts`)
  - `/src/i18n/translations.ts`
  - `/src/context/AppContext.tsx`
  - `/src/components/` (`TopBar.tsx`, `StatusBanner.tsx`, `HazardModule.tsx`, `MapView.tsx`, `DateScrubber.tsx`, `BriefPanel.tsx`, `ChatPanel.tsx`, `ActionPlanPanel.tsx`, `MethodsDrawer.tsx`, `ErrorBoundary.tsx`)
  - `/src/utils/` (`geo.ts`, `cache.ts`, `share.ts`)

---

### 10. EDGE STATES, ACCESSIBILITY & FINAL COMPLETENESS CHECKLIST
- **Deliberate Edge States (Zero Apologetic Filler):**
  - Sequential `"Systems Check"` loading skeleton on location change.
  - Partial API failure: affected module shows `"Source unavailable"` + inline `"Retry"` button while healthy modules continue working.
  - Offline mode (`navigator.onLine === false`): displays cached snapshot with `"Offline — showing cached telemetry from {time}"`.
  - Stale cache (`age > 2 × TTL`): visible `"Stale"` chip on affected module.
  - Geolocation denied / empty search results / zero nearby detections (`"No thermal anomalies detected within {radius} km in the past 48 hours"`).
- **Accessibility & Quality Bar:**
  - WCAG AA contrast in both themes; visible `2px` keyboard focus rings; `aria-live="polite"` on overall status changes; `>= 44px` touch targets on mobile.
  - Accessible tabular list toggle inside the Map viewport listing nearby detections/events with distance and compass bearing for screen readers.
  - React `ErrorBoundary` wrapping the Map viewport and Right Intelligence Deck so no runtime exception ever white-screens the app.
- **Final Self-Verification Before Finishing:**
  1. Verify all 7 API services, TTL caching, `riskEngine.ts`, and `AppContext` compile cleanly with strict TypeScript types.
  2. Verify `react-leaflet` uses custom `L.divIcon` SVG markers and valid NASA GIBS WMTS tile URLs.
  3. Verify full bilingual English + Urdu RTL support, 4 Judge Demo Scenarios, WhatsApp Share formatter, Print stylesheet, `vercel.json`, `.env.example`, and `README.md` are all present and complete.