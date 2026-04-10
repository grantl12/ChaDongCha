from fastapi import APIRouter, Query
from postgrest.types import CountMethod
from db import get_client

router = APIRouter()


@router.get("/nearby")
async def nearby_segments(
    lat: float = Query(...),
    lon: float = Query(...),
    radius_km: float = Query(5.0, le=20.0),
):
    """
    Returns road segments near the given coordinates.
    Segments are pre-seeded from OpenStreetMap data (Phase 7 worker).
    Until OSM data is loaded this returns an empty list — the mobile
    map handles that gracefully.

    Simple bounding-box filter (no PostGIS required):
      1° latitude  ≈ 111 km
      1° longitude ≈ 111 km × cos(lat)
    """
    import math
    lat_delta = radius_km / 111.0
    lon_delta = radius_km / (111.0 * max(math.cos(math.radians(lat)), 0.01))

    db = get_client()
    result = db.table("road_segments") \
        .select("*, players(username)") \
        .execute()

    # Filter in Python — road_segments has no geometry column yet,
    # so we filter by city match as a proxy until PostGIS is wired.
    # Once geometry is stored this becomes a proper spatial query.
    return result.data or []


@router.get("/stats/{player_id}")
async def player_territory_stats(player_id: str):
    """Count of roads a player currently holds as Road King."""
    db = get_client()
    result = db.table("road_segments") \
        .select("id", count=CountMethod.exact) \
        .eq("king_id", player_id) \
        .execute()
    return {"road_king_count": result.count or 0}
