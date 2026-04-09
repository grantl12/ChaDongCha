# 차동차 CHADONGCHA

> Collect. Hunt. Own Your Road.

Real-world vehicle collection game — Pokémon GO for car culture.
On-device AI identifies vehicles by make, model, and generation.
Players own roads. Community builds the database. Satellites are catchable.

---

## Repository Structure

```
chadongcha/
├── backend/          FastAPI API + workers
├── mobile/           Expo React Native app (iOS + Android)
├── ml/               Model training pipeline
└── vehicle-db/       Vehicle database seed + 3D assets
```

---

## Quick Start

### 1. Supabase (database)

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the schema:
   ```
   supabase db push < backend/schema.sql
   ```
   Or paste `backend/schema.sql` into the Supabase SQL editor.
3. Copy your Project URL and service key.

### 2. Backend API

```bash
cd backend
cp .env.example .env          # fill in SUPABASE_URL + SUPABASE_SERVICE_KEY
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Satellite tracking worker (separate process):
```bash
cd backend
python workers/satellite_tracker.py
```

### 3. Mobile App

```bash
cd mobile
npm install
npx expo prebuild             # generates native iOS/Android projects

# iOS
npx expo run:ios

# Android
npx expo run:android
```

> **Native modules required:** `vehicle-classifier` and `alpr-wrapper`
> both require native code. You must run `expo prebuild` before running
> on a device. Expo Go will not work.

For development without native modules, swap imports in screens to use
the stub implementations:
```typescript
import { VehicleClassifierStub as VehicleClassifier } from '../modules/vehicle-classifier';
import { ALPRWrapperStub as ALPRWrapper } from '../modules/alpr-wrapper';
```

### 4. ML Training

```bash
cd ml
pip install ultralytics torch torchvision timm coremltools

# See what generation classes are configured
python training/bootstrap.py --phase info

# Train classifier (requires dataset in ml/data/images/)
python training/bootstrap.py --phase classify --epochs 30

# Export to CoreML + TFLite
python training/bootstrap.py --phase export
```

---

## Environment Variables

### Backend `.env`
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
ALLOWED_ORIGINS=http://localhost:8081,https://your-app.com
```

### Mobile — update `mobile/src/api/client.ts`
```typescript
export const API_BASE_URL = 'http://localhost:8000'; // dev
// export const API_BASE_URL = 'https://your-api.railway.app'; // prod
```

---

## Week 1 Priorities (read the brief)

1. **ALPR latency spike** — build minimal plate detector prototype,
   benchmark on iPhone XS + Pixel 6a. Decision gates pipeline architecture.

2. **Vision Camera frame processor** — confirm synchronous CoreML call
   is supported in VisionCamera v4. Run the highway mode screen on a
   real device with the stub classifier.

3. **EfficientNet-Lite B2 compile** — verify the CoreML + TFLite
   export pipeline produces a valid model that loads on-device.

---

## Key Decisions Already Made

| Decision | Choice | Rationale |
|---|---|---|
| Platform | React Native (Expo bare) | Single codebase, native ML modules |
| Camera | react-native-vision-camera v4 | Frame processor API for synchronous inference |
| ML runtime (iOS) | CoreML | Neural Engine acceleration |
| ML runtime (Android) | TFLite | GPU delegate on Snapdragon 778G+ |
| Classification unit | Generation (not year) | Visual design = generation, not model year |
| ADS-B | Shelved → Satellites via Celestrak | More thematic, legally cleaner |
| Privacy | All camera processing on-device | No frames ever transmitted |
| ALPR | Confidence boost only, plate never exits wrapper | Enforced at interface level |
| Backend | Railway + Supabase + Cloudflare R2 | Low ops overhead, scales to launch |

---

## Architecture Diagram

```
Phone Camera
    │
    ▼
Stage 1: MobileNet SSD trigger (2fps, low power)
    │ vehicle detected
    ▼
Stage 2: EfficientNet-Lite B2 classification
    │ + ALPR wrapper (confidence boost, plate zeroed)
    ▼
Catch result: {make, model, generation, color, confidence}
    │
    ├─→ Local garage (Zustand + persist)
    └─→ Backend API (Railway/FastAPI → Supabase)
              │
              ├─→ XP computation + level up
              ├─→ First finder check
              ├─→ Road ownership update
              └─→ City weekly score
```

---

## From Amber's Angels

Reusing these components (see brief §3.6 for full map):

- `vehicle_classifier.py` → foundation for on-device model architecture
- `aggregation_service.py` → multi-frame confidence scoring logic
- `mobile/modules/phone-camera/` → Android Foreground Service (HIGHEST VALUE — saves 2–3 weeks)
- Expo + auth scaffold → adapted for player accounts

---

## Brief

Full engineering brief: `chadongcha-v2-engineering-brief.docx`
