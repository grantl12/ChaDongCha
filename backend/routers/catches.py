from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone, timedelta

from db import get_client
from services.xp_service import compute_xp, apply_xp
from services.territory_service import record_road_scan
from services.first_finder_service import check_first_finder

# --- Dedup configuration ---
# Tier 1 (hash-based): plate hash is only trusted when ALPR plate read confidence
# is high enough. Below this, the hash is too unreliable to use for dedup.
HASH_DEDUP_MIN_PLATE_CONFIDENCE = 0.85
HASH_DEDUP_WINDOW_HOURS         = 4

# Tier 2 (fuzzy): same generation + same district + short window.
# Catches parking-lot farming even without a reliable plate read.
# Intentionally short — a tight window avoids false positives on busy roads
# where many cars of the same model pass through the same district.
FUZZY_DEDUP_WINDOW_MINUTES      = 20

router = APIRouter()


class CatchPayload(BaseModel):
    generation_id: Optional[str] = None       # null = unknown vehicle
    variant_id: Optional[str] = None
    catch_type: str                            # highway | scan360 | space | unknown
    color: Optional[str] = None
    body_style: Optional[str] = None
    confidence: Optional[float] = None
    fuzzy_city: Optional[str] = None
    fuzzy_district: Optional[str] = None
    road_segment_id: Optional[str] = None
    space_object_id: Optional[str] = None
    caught_at: datetime
    # ALPR output — confidence boost + dedup signals. Plate NEVER in payload.
    alpr_confidence_boost: Optional[float] = None
    # ALPR's confidence in its own plate character read (0.0–1.0).
    # Used to decide whether vehicle_hash is reliable enough for hash-based dedup.
    alpr_plate_confidence: Optional[float] = None
    # SHA-256 hash of plate, zeroed on-device immediately after hashing.
    # Only trusted for dedup when alpr_plate_confidence >= 0.85.
    vehicle_hash: Optional[str] = None


@router.post("")
async def ingest_catch(body: CatchPayload, authorization: str = Header(...)):
    db = get_client()

    # Resolve player from JWT
    token = authorization.replace("Bearer ", "")
    try:
        user = db.auth.get_user(token)
        player_id = user.user.id
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    # Two-tier dedup check
    dedup_result = _check_dedup(
        db, player_id,
        vehicle_hash=body.vehicle_hash,
        plate_confidence=body.alpr_plate_confidence,
        generation_id=body.generation_id,
        fuzzy_district=body.fuzzy_district,
    )
    is_duplicate = dedup_result is not None

    # Insert catch row
    catch_row = {
        "player_id": player_id,
        "generation_id": body.generation_id,
        "variant_id": body.variant_id,
        "catch_type": body.catch_type,
        "color": body.color,
        "body_style": body.body_style,
        "confidence": body.confidence,
        "fuzzy_city": body.fuzzy_city,
        "fuzzy_district": body.fuzzy_district,
        "road_segment_id": body.road_segment_id,
        "space_object_id": body.space_object_id,
        "caught_at": body.caught_at.isoformat(),
        "synced_at": datetime.utcnow().isoformat(),
        # Only persist the hash when plate confidence was high enough to trust it.
        # Low-confidence hashes aren't reliable and shouldn't poison future dedup checks.
        "vehicle_hash": body.vehicle_hash
            if (body.alpr_plate_confidence or 0) >= HASH_DEDUP_MIN_PLATE_CONFIDENCE
            else None,
    }
    result = db.table("catches").insert(catch_row).execute()
    catch_id = result.data[0]["id"]

    # Short-circuit XP + territory + first-finder for duplicates.
    # Catch is still recorded — it's a real sighting — just no reward.
    if is_duplicate:
        return {
            "catch_id": catch_id,
            "xp_earned": 0,
            "new_total_xp": _get_player_xp(db, player_id),
            "level_up": False,
            "road_king_claimed": False,
            "first_finder_awarded": None,
            "duplicate": True,
            "duplicate_reason": dedup_result,   # "hash" | "fuzzy"
        }

    # XP computation
    xp_earned, xp_reasons = compute_xp(
        catch_type=body.catch_type,
        generation_id=body.generation_id,
        rarity_tier=_get_rarity(db, body.generation_id),
        is_personal_first=_is_personal_first(db, player_id, body.generation_id),
    )
    new_total_xp, level_up = apply_xp(db, player_id, xp_earned, catch_id, xp_reasons)

    # Territory
    road_king_claimed = False
    if body.road_segment_id:
        road_king_claimed = record_road_scan(db, player_id, body.road_segment_id)

    # First finder
    first_finder_awarded = None
    if body.generation_id:
        first_finder_awarded = check_first_finder(
            db, player_id, body.generation_id, body.variant_id,
            body.fuzzy_city, catch_id,
        )

    return {
        "catch_id": catch_id,
        "xp_earned": xp_earned,
        "new_total_xp": new_total_xp,
        "level_up": level_up,
        "road_king_claimed": road_king_claimed,
        "first_finder_awarded": first_finder_awarded,
        "duplicate": False,
    }


def _check_dedup(
    db,
    player_id: str,
    vehicle_hash: Optional[str],
    plate_confidence: Optional[float],
    generation_id: Optional[str],
    fuzzy_district: Optional[str],
) -> Optional[str]:
    """
    Two-tier dedup. Returns the tier that fired ("hash" | "fuzzy"), or None.

    Tier 1 — Hash (exact plate identity):
      Requires plate_confidence >= 0.85 to be trustworthy. A lower-confidence
      read may have misread characters, producing a hash that doesn't match the
      same plate on the next pass. Window: 4 hours.

    Tier 2 — Fuzzy (generation + district + time):
      Catches the parking-lot farming case even without a readable plate.
      Same player + same generation + same district within 20 minutes = same car.
      Window intentionally short to avoid false positives on busy roads where
      many cars of the same model legitimately pass through the same district.
    """
    now = datetime.now(timezone.utc)

    # Tier 1: hash-based — only when plate read confidence is high enough
    if vehicle_hash and (plate_confidence or 0) >= HASH_DEDUP_MIN_PLATE_CONFIDENCE:
        cutoff = (now - timedelta(hours=HASH_DEDUP_WINDOW_HOURS)).isoformat()
        result = db.table("catches").select("id", count="exact") \
            .eq("player_id", player_id) \
            .eq("vehicle_hash", vehicle_hash) \
            .gte("caught_at", cutoff) \
            .execute()
        if (result.count or 0) > 0:
            return "hash"

    # Tier 2: fuzzy — generation + district + tight time window
    if generation_id and fuzzy_district:
        cutoff = (now - timedelta(minutes=FUZZY_DEDUP_WINDOW_MINUTES)).isoformat()
        result = db.table("catches").select("id", count="exact") \
            .eq("player_id", player_id) \
            .eq("generation_id", generation_id) \
            .eq("fuzzy_district", fuzzy_district) \
            .gte("caught_at", cutoff) \
            .execute()
        if (result.count or 0) > 0:
            return "fuzzy"

    return None


def _get_player_xp(db, player_id: str) -> int:
    result = db.table("players").select("xp").eq("id", player_id).single().execute()
    return result.data["xp"] if result.data else 0


def _get_rarity(db, generation_id: Optional[str]) -> Optional[str]:
    if not generation_id:
        return None
    result = db.table("generations").select("rarity_tier").eq("id", generation_id).maybe_single().execute()
    return result.data["rarity_tier"] if result.data else None


def _is_personal_first(db, player_id: str, generation_id: Optional[str]) -> bool:
    if not generation_id:
        return False
    result = db.table("catches").select("id", count="exact") \
        .eq("player_id", player_id) \
        .eq("generation_id", generation_id) \
        .execute()
    return (result.count or 0) == 0
