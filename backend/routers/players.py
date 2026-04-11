from fastapi import APIRouter, HTTPException
from db import get_client

router = APIRouter()

RARITIES = ["common", "uncommon", "rare", "epic", "legendary"]


@router.get("/{player_id}/stats")
async def player_stats(player_id: str):
    """
    Full profile stats for a player:
      - catches by rarity tier
      - road king count
      - first finder badges (with vehicle name)
    """
    db = get_client()

    # Verify player exists
    player = db.table("players").select("id, username, xp, level") \
        .eq("id", player_id).maybe_single().execute()
    if not player.data:
        raise HTTPException(status_code=404, detail="Player not found")

    # Catches grouped by rarity via generations join
    catches_res = db.table("catches") \
        .select("id, generations(rarity_tier)") \
        .eq("player_id", player_id) \
        .execute()

    by_rarity: dict[str, int] = {r: 0 for r in RARITIES}
    total_catches = 0
    for row in (catches_res.data or []):
        total_catches += 1
        gen = row.get("generations") or {}
        tier = gen.get("rarity_tier") if gen else None
        if tier in by_rarity:
            by_rarity[tier] += 1

    # Road King count
    from postgrest.types import CountMethod
    roads_res = db.table("road_segments") \
        .select("id", count=CountMethod.exact) \
        .eq("king_id", player_id) \
        .execute()
    road_king_count = roads_res.count or 0

    # First finder badges
    ff_res = db.table("first_finders") \
        .select("badge_name, region_scope, region_value, awarded_at, "
                "generations(common_name, models(name, makes(name)))") \
        .eq("player_id", player_id) \
        .order("awarded_at", desc=True) \
        .execute()

    badges = []
    for ff in (ff_res.data or []):
        gen = ff.get("generations") or {}
        model = gen.get("models") or {}
        make = (model.get("makes") or {}).get("name", "")
        model_name = model.get("name", "")
        vehicle = gen.get("common_name") or f"{make} {model_name}".strip() or "Unknown"
        badges.append({
            "badge_name":   ff["badge_name"],
            "region_scope": ff["region_scope"],
            "region_value": ff["region_value"],
            "awarded_at":   ff["awarded_at"],
            "vehicle_name": vehicle,
        })

    return {
        "total_catches":  total_catches,
        "catches_by_rarity": by_rarity,
        "road_king_count": road_king_count,
        "first_finder_badges": badges,
    }
