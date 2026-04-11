# 차동차 · ChaDongCha

Pokémon GO for cars. Players catch real vehicles using on-device AI, own road segments as territory, battle AI rivals, and track satellites as rare time-limited collectibles.

---

## Repository Layout

```
chadongcha/
├── backend/
│   ├── routers/         auth, catches, vehicles, territory, satellites, players
│   ├── services/        xp_service.py, notification_service.py
│   ├── workers/         satellite_tracker.py, osm_seeder.py
│   ├── scripts/         seed_vehicles.py, seed_ai_rivals.py
│   └── migrations/      001 – 004 (run in order via Supabase SQL editor)
├── mobile/
│   ├── app/
│   │   ├── (tabs)/      feed, garage, highway, map, radar, profile
│   │   ├── vehicle/     [id].tsx — vehicle detail page
│   │   ├── scan360.tsx  360° scan mode
│   │   ├── leaderboard.tsx
│   │   └── onboarding.tsx
│   └── src/
│       ├── stores/      catchStore, playerStore, settingsStore
│       ├── hooks/       useLocation, usePushNotifications
│       ├── components/  PrivacyShield
│       ├── utils/       plateHash.ts
│       └── modules/     vehicle-classifier (stub → Phase 5 native)
├── ml/
│   └── training/        train_colab.ipynb  (EfficientNet-Lite B2, Colab-ready)
└── vehicle-db/          3D asset manifest (glTF — not yet populated)
```

---

## Stack

**Backend:** FastAPI · Supabase (Postgres + Auth + RLS) · Railway · Expo Push API · Celestrak TLEs  
**Mobile:** Expo SDK 52 · Expo Router · React Query · Zustand · VisionCamera v4 · Reanimated 3 · Mapbox (`@rnmapbox/maps ~10.2.10`)  
**ML:** EfficientNet-Lite B2 via `timm` · Google Colab training pipeline · ONNX → TFLite int8 export  
**CI:** GitHub Actions → EAS cloud builds (manual `workflow_dispatch` — preserves build quota)

---

## Game Modes

| Mode | What it does |
|------|--------------|
| **Highway Mode** | Passive camera scan at speed. On-device classifier IDs vehicles, awards XP. Two-stage pipeline: MobileNet SSD trigger at 2fps → full EfficientNet classify only on trigger (adaptive throttle). Currently stub classifier — Phase 5. |
| **360° Scan** | Walk around a parked car capturing FRONT/PASSENGER/REAR/DRIVER anchors. High confidence catch for car shows and lots. |
| **Road King** | Catch vehicles on a road segment to claim it as territory. The player with the most scans in 30 days holds the crown. Territory flips when a rival outruns you. Map shows owned roads glowing red (yours) or blue (theirs). |
| **Space Mode** | ISS + satellite passes computed from live TLEs via SGP4. Time-limited, location-gated catchable objects. Catching a satellite triggers **Orbital Boost** — a 30-120 min XP multiplier (1.25×–2×) on subsequent vehicle catches. |

---

## Architecture

```
On-Device (React Native)
├── VisionCamera v4 frame processor (Reanimated worklet)
│   ├── Stage 1: vehicle presence detector (stub → MobileNet SSD at 2fps)
│   └── Stage 2: make/model/generation/color classifier (stub → EfficientNet-Lite B2)
│
├── Privacy Shield  — geometric overlay on windshield/window bands (Phase 5: real face detection)
├── Plate Hash      — opt-in: plate → SHA-256 on-device; hash POSTed to server for dedup
│                     Plate text never stored or transmitted
│
└── catchStore (Zustand + AsyncStorage, offline-first)
    ├── addCatch() queues record locally, triggers syncPending()
    ├── resolveGenerationId() → GET /vehicles/resolve (make/model/generation → generation_id + rarity)
    ├── POST /catches → XP, level-up, road king, orbital boost, first finder, plate match
    └── AppState 'active' listener retries unsynced catches on foreground

Backend (Railway)
├── FastAPI routers
│   ├── /auth          signup, signin, push token registration
│   ├── /catches       record catch, dedup, XP, road king, notifications
│   ├── /vehicles      resolve generation, recent sightings
│   ├── /territory     nearby road segments (geometry GeoJSON), road leaderboard
│   ├── /satellites    upcoming passes (SGP4), orbital boost status
│   ├── /leaderboard   global + per-city XP rankings
│   └── /players       stats, plate hashes (CRUD), first finder badges
│
├── Services
│   ├── xp_service.py         non-linear levelling, orbital boost multiplier, road king XP
│   └── notification_service.py  Expo Push API — road king, level up, first finder, spotted
│
└── Workers (Railway services)
    ├── satellite_tracker.py  polls Celestrak TLEs, SGP4 passes, push notify on approach
    └── osm_seeder.py         Overpass API → road_segments (14 cities pre-seeded)
```

---

## XP & Levelling

Non-linear level bands (mirrors backend `_level_for_xp`):

| Levels | XP band per level |
|--------|-------------------|
| 1–5    | 500 XP            |
| 6–10   | 1 000 XP          |
| 11–20  | 4 000 XP          |
| 21–35  | 10 000 XP         |
| 36–50  | 50 000 XP         |
| 51+    | 200 000 XP        |

**Orbital Boost** stacks on all vehicle catches for its duration. Multipliers:

| Satellite rarity | Multiplier | Duration |
|-----------------|-----------|----------|
| Common          | 1.25×     | 30 min   |
| Rare            | 1.5×      | 60 min   |
| Epic            | 1.75×     | 90 min   |
| Legendary       | 2.0×      | 120 min  |

**Road King Takeover:** 300 XP bonus on first successful claim after displacing a king.

**First Finder:** awarded to the first player to catch a specific vehicle generation in their city. Badge persists on their profile and vehicle detail page.

**Spotter Award:** if another player's opt-in plate hash matches a catch, the catcher earns a 150 XP spotter bonus and both players receive a push notification.

---

## Catch Dedup

Three tiers applied in order:

1. **Hash dedup** — SHA-256(plate) within a 4hr window, only when plate confidence ≥ 85%
2. **Fuzzy dedup** — same `generation_id` + `fuzzy_district`, within 20 min (highway) or 3 min (scan360)
3. **Time-gap** — minimum interval per catch type as final backstop

Plate text never leaves the device. `fuzzy_district` is derived from reverse geocoding with 500m movement threshold to avoid hammering the geocoder.

---

## Privacy

- **Plate text:** zeroed at ALPR module boundary. One-way SHA-256 used for dedup and opt-in spotter awards only.
- **Location:** `fuzzy_city` and `fuzzy_district` only — no lat/lon stored on catches. Geocoding throttled to once per 500m of movement.
- **Privacy Shield:** geometric overlay over windshield and window bands in camera views. Phase 5 will use real-time face detection bounding boxes from VisionCamera.
- **Plate hash opt-in:** entirely user-driven. Users register their plate via the profile screen; the app hashes on-device before sending.

---

## AI Rival Road Kings

`backend/scripts/seed_ai_rivals.py` populates ghost Road Kings so new cities feel alive before real players arrive.

```bash
python scripts/seed_ai_rivals.py --city Seoul --density 0.30
python scripts/seed_ai_rivals.py --city "Los Angeles" --dry-run
```

- Seeds ~30% of segments per city (configurable via `--density`)
- 5 archetype rivals per city (names/XP derived from city seed for determinism)
- King scan counts set to beatable in one session (3–15 scans)
- Ghost kings never reclaim territory after displacement
- Excluded from leaderboards and feed events — map only
- `is_ai_rival = true` on `players` table distinguishes ghosts from real players

---

## Database Migrations

Run in order via Supabase SQL editor:

| Migration | What it adds |
|-----------|--------------|
| `001_road_segments_geometry.sql` | `centroid_lat/lon`, `geometry_json` on `road_segments`; `expo_push_token` on `players` |
| `002_*` | (see file) |
| `003_*` | (see file) |
| `004_plate_hashes.sql` | `plate_hashes` table (SHA-256 only, unique per player); `spotted_events` audit log; RLS policies; `plate_hash_idx` |

Vehicle database: ~291 generations across ~40 makes. Seed via `backend/scripts/seed_vehicles.py`.

---

## Environment Variables

| Variable | Where used |
|----------|-----------|
| `SUPABASE_URL` | backend + mobile |
| `SUPABASE_ANON_KEY` | mobile (public) |
| `SUPABASE_SERVICE_KEY` | backend workers only — bypasses RLS |
| `MAPBOX_PUBLIC_TOKEN` | mobile runtime (`pk.` prefix) |
| `MAPBOX_DOWNLOADS_TOKEN` | Android Gradle build (`sk.` prefix) — set via `eas env:create` |

Backend vars live in Railway project settings. Mobile vars live in EAS (`eas env:create --scope project`).

---

## Running Locally

**Backend:**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

**Mobile:**
```bash
cd mobile
npm install --legacy-peer-deps
npx expo start
```

**Workers (manual):**
```bash
# Seed road segments (Overpass API)
python workers/osm_seeder.py                              # all 14 cities
python workers/osm_seeder.py --city Seoul
python workers/osm_seeder.py --bbox 37.4,126.8,37.7,127.2 --city Custom --country KR

# Satellite pass worker (continuous)
python workers/satellite_tracker.py

# Seed AI rival Road Kings
python scripts/seed_ai_rivals.py --city Seoul --density 0.30
python scripts/seed_ai_rivals.py --dry-run   # preview only
```

---

## ML Training

`ml/training/train_colab.ipynb` is a Colab-ready notebook:

1. Mount Google Drive
2. Load dataset (`train/`, `val/` folders — one subfolder per class label)
3. Phase 1: 10-epoch head warmup with EfficientNet-Lite B2 backbone frozen
4. Phase 2: full unfreeze, LR ÷ 5, CosineAnnealingLR, label smoothing 0.1
5. Best-model checkpoint restored, exported to ONNX → TFLite int8
6. Class map JSON saved to Drive for native module integration

Target: ≥ 85% top-1 accuracy on a held-out set of 50+ makes.

---

## Status

| Component | Status |
|-----------|--------|
| Supabase schema + RLS | ✅ |
| FastAPI: auth, catches, XP, territory, satellites, players | ✅ |
| Three-tier catch dedup (hash → fuzzy → time-gap) | ✅ |
| Vehicle DB (~291 generations, 40 makes) | ✅ |
| EAS builds (manual trigger) | ✅ |
| Feed tab (date sections, GLOBAL/MINE tabs, rarity colors, space catches) | ✅ |
| Garage tab (grid, rarity cards, XP badge, first finder) | ✅ |
| Vehicle detail page (personal stats, recent sightings, rarity tint) | ✅ |
| Roads / territory map (Mapbox LineLayer, road king bottom sheet, claim progress) | ✅ |
| Radar tab (satellite list, per-second countdown, CATCH button, orbital boost) | ✅ |
| Profile screen (level progress, rarity bar, boost banner, plates, settings) | ✅ |
| 3-step onboarding (splash → auth → permissions) | ✅ |
| Leaderboard (global + city tabs, YOU highlight) | ✅ |
| OSM road seeder (14 cities) | ✅ |
| Satellite tracker worker (SGP4, push notify on approach) | ✅ |
| XP feedback loop (catch sync → applyXp → level-up banner) | ✅ |
| Orbital Boost (space catch → multiplier, amber HUD pill) | ✅ |
| Push notifications (road king, level up, first finder, spotted, boost) | ✅ |
| AI rival Road Kings (seed script, ghost territory) | ✅ |
| Privacy Shield (geometric overlay, Phase 5 hook points) | ✅ |
| Plate hash opt-in (on-device SHA-256, spotter award) | ✅ |
| fuzzyDistrict dedup (reverse geocode, 500m throttle) | ✅ |
| ML training pipeline (EfficientNet-Lite B2 Colab notebook) | ✅ |
| Highway Mode classifier (native — Phase 5) | 🔧 Phase 5 |
| 360° Scan classifier (native — Phase 5) | 🔧 Phase 5 |
| Privacy Shield face detection (Phase 5) | 🔧 Phase 5 |
| 3D glTF garage rendering | 🔧 Phase 6 |
| Community unknown-vehicle ID flow | 🔧 Phase 9 |
| TestFlight + Play Store internal track | 🔧 Phase 11 |

---

## Pre-Submission TODOs

### Highway Mode naming (App Store safety)
"Highway Mode" implies driver use. Before submission:
- Rename to a passenger-implied term ("Streak Mode," "Rolling Catch," etc.)
- Add one-time interstitial: "For passengers only. Never use while driving." with required acknowledgment tap
- Call out passenger-only use in App Store description copy

### Ghost king retirement
Once a city has sufficient real player density (30-day active player count threshold), the seeder script should be re-run with `--density 0` to stop assigning new ghost kings. Existing ghost kings naturally get displaced as real players catch routes. No automated retirement is implemented yet.

---

## CI

EAS builds are **manual only** (`workflow_dispatch`) to avoid burning Expo build quota on every push. Trigger via GitHub Actions UI with a `platform` input (`all` / `android` / `ios`).

Type-checking: `mypy backend/` (strict). Lint: `ruff check backend/`.
