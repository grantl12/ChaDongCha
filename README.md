# 차동차 · ChaDongCha

Pokémon GO for cars. Players catch real vehicles using on-device AI, own road segments as territory, and track satellites as rare time-limited collectibles.

---

## Repository Layout

```
chadongcha/
├── backend/          FastAPI API, workers, migrations, Supabase schema
│   ├── routers/      auth, catches, vehicles, territory, satellites
│   ├── workers/      satellite_tracker.py, osm_seeder.py
│   ├── scripts/      seed_vehicles.py, seed_ai_rivals.py (planned)
│   └── migrations/   001_road_segments_geometry.sql
├── mobile/           Expo SDK 52 React Native app (iOS + Android)
│   ├── app/          expo-router file-based screens
│   │   ├── (tabs)/   feed, garage, highway, map, radar
│   │   └── vehicle/  [id].tsx — vehicle entry page
│   └── src/
│       ├── stores/   catchStore, playerStore (Zustand)
│       └── hooks/    useLocation, useCamera
├── ml/               Model training pipeline (EfficientNet-Lite B2, not yet wired)
└── vehicle-db/       3D asset manifest (glTF, not yet populated)
```

---

## Stack

**Backend:** FastAPI · Supabase (Postgres + Auth + RLS) · Railway · Cloudflare R2 · Celestrak TLEs  
**Mobile:** Expo SDK 52 · Expo Router · React Query · Zustand · VisionCamera v4 · Reanimated 3 · Mapbox (`@rnmapbox/maps`)  
**CI:** GitHub Actions → EAS cloud builds (manual trigger only — `workflow_dispatch` — to avoid burning build quota)

---

## Game Modes

| Mode | What it does |
|------|-------------|
| **Highway Mode** | Passive camera scan at speed — on-device classifier IDs vehicles, awards XP. Currently stub classifier. |
| **360° Scan** | Walk around a parked car for high-confidence catch. Designed for car shows and lots. |
| **Road King** | Catch vehicles on a road segment to claim it. Territory flips when a rival outruns you. Map powered by Mapbox + OSM-seeded segments. |
| **Space Mode** | ISS and satellite passes computed from live TLEs. Time-limited, location-gated catchable objects. Push notification when a pass is approaching. |

---

## Architecture Notes

```
On-Device (React Native)
├── VisionCamera v4 frame processor
│   ├── Stage 1: vehicle presence detector (stub → MobileNet SSD)
│   └── Stage 2: make/model/generation classifier (stub → EfficientNet-Lite B2)
│       ALPR wrapper: plate → SHA-256 hash for dedup only. plate text never stored.
│
└── Catch result synced to FastAPI via catchStore.syncPending()
    ├── Resolves generation_id via GET /vehicles/resolve
    ├── Posts to POST /catches → XP awarded, level-up detected
    └── Stored locally in Zustand + AsyncStorage (offline-first)

Backend (Railway)
├── FastAPI routers: auth, catches, vehicles, territory, satellites
├── Supabase: Postgres with RLS on all player-owned tables
└── Workers (Railway services):
    ├── satellite_tracker.py  — polls Celestrak, computes SGP4 passes, triggers push
    └── osm_seeder.py         — Overpass API → road_segments (14 cities seeded)
```

**Privacy contract:** plate text is zeroed at the ALPR module boundary. Only a one-way SHA-256 hash is used for dedup. No street-level coordinates stored — catches record `fuzzy_city` only via reverse geocoding.

---

## Database

Schema is in `backend/schema.sql`. Run migrations in order via Supabase SQL editor.

| Migration | What it adds |
|-----------|-------------|
| `001_road_segments_geometry.sql` | `centroid_lat`, `centroid_lon`, `geometry_json` on `road_segments`; `expo_push_token` on `players` |

Vehicle database has ~291 generations across ~40 makes. Seeded via `backend/scripts/seed_vehicles.py`.

RLS is enabled on all tables. The service role key (never exposed to mobile) bypasses RLS for workers.

---

## Environment Variables

| Variable | Where used |
|----------|-----------|
| `SUPABASE_URL` | backend + mobile |
| `SUPABASE_ANON_KEY` | mobile (public) |
| `SUPABASE_SERVICE_KEY` | backend workers only |
| `MAPBOX_PUBLIC_TOKEN` | mobile runtime (`pk.` prefix) |
| `MAPBOX_DOWNLOADS_TOKEN` | Android Gradle build (`sk.` prefix) — set via `eas env:create` |

Backend vars live in Railway. Mobile vars live in EAS environment (set via `eas env:create --scope project`).

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
npm install
npx expo start
```

**Workers (one-shot / manual):**
```bash
cd backend
python workers/osm_seeder.py                          # seed all 14 cities
python workers/osm_seeder.py --city Seoul             # single city
python workers/osm_seeder.py --bbox 37.4,126.8,37.7,127.2 --city Custom --country KR
python workers/satellite_tracker.py                   # runs continuously
```

---

## Status

| Component | Status |
|-----------|--------|
| Supabase schema + RLS | ✅ |
| FastAPI: auth, catches, XP, territory, satellites | ✅ |
| Three-tier catch dedup (hash → fuzzy → time-gap) | ✅ |
| Vehicle DB (~291 generations, 40 makes) | ✅ |
| EAS builds (manual trigger) | ✅ |
| Feed tab (React Query, rarity colors, pull-to-refresh) | ✅ |
| Garage tab (grid, rarity cards, XP badge, first finder) | ✅ |
| Vehicle entry page `/vehicle/[id]` | ✅ |
| Roads / territory map (Mapbox + LineLayer) | ✅ |
| Radar tab (satellite pass list, location-gated) | ✅ |
| OSM road seeder (14 cities) | ✅ |
| Satellite tracker worker (SGP4 ECI→topocentric, push notify) | ✅ |
| XP feedback loop (catch sync → applyXp → level-up) | ✅ |
| Reverse geocoding → fuzzyCity on catches | ✅ |
| Highway Mode classifier (stub) | 🔧 Phase 3 |
| 360° Scan classifier (stub) | 🔧 Phase 3 |
| 3D glTF garage rendering | 🔧 Phase 6 |
| Community feed + unknown vehicle ID flow | 🔧 Phase 9 |
| AI rival Road Kings (ghost territory seeding) | 🔧 Phase 9 |
| Highway Mode UX safety rename + passenger disclaimer | 🔧 Pre-submission |
| Privacy audit | 🔧 Phase 10 |
| TestFlight + Play Store internal track | 🔧 Phase 11 |

---

## Known Issues / Pre-Submission TODOs

### Highway Mode naming (App Store safety)
"Highway Mode" by name implies driver use and will pattern-match to distracted driving reviewers at Apple/Google. Before submission:
- Rename to something passenger-implied ("Streak Mode," "Rolling Catch," etc.)
- Add one-time interstitial: "For passengers only. Never use while driving." with required acknowledgment tap
- Call out passenger use explicitly in App Store description

### Empty world problem (Road King territory)
New cities with few players show a map of unclaimed gray roads — no tension, no competition. Plan:
- `backend/scripts/seed_ai_rivals.py`: inserts placeholder Road Kings on high-prominence roads (motorway/trunk first) with modest `king_scan_count` (3–15, beatable in one session)
- Ghost kings hold territory but never reclaim it after displacement
- Ghost kings are excluded from leaderboards and feed events — they only appear on the map
- Ghost seeding stops in a city once real player density is sufficient (30-day activity check)
- `is_ai_rival boolean` flag on `players` table distinguishes ghosts from real players

---

## CI

EAS builds are **manual only** (`workflow_dispatch`) to avoid burning Expo build quota. Trigger via GitHub Actions UI with platform input (`all` / `android` / `ios`).

Type-checking: `mypy backend/` (strict). Lint: `ruff check backend/`.
