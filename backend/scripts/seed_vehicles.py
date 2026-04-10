"""
Vehicle database seed — top ~120 recognizable generations for North American roads.

Usage:
    cd backend
    SUPABASE_URL=... SUPABASE_SERVICE_KEY=... python scripts/seed_vehicles.py

Or with .env loaded:
    python -c "from dotenv import load_dotenv; load_dotenv()" && python scripts/seed_vehicles.py

Rarity tiers:
  common     — mainstream daily drivers seen on every block
  uncommon   — less ubiquitous but instantly recognizable
  rare       — enthusiast cars, limited trims, EVs pre-mainstream
  epic       — performance variants, sports cars, low-volume luxury
  legendary  — supercars, ultra-rare, sub-1000 units/year in US
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from supabase import create_client

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]

# ---------------------------------------------------------------------------
# Seed data: (generation_number, common_name, year_start, year_end, rarity, annual_volume)
# year_end = None means currently in production
# ---------------------------------------------------------------------------
SEED: list[dict] = [
    {
        "make": "Toyota", "country": "JP",
        "models": [
            {"name": "Camry", "class": "car", "generations": [
                (8, "XV70 (2018–present)",  2018, None, "common",    336000),
                (7, "XV50 (2012–2017)",     2012, 2017, "common",    280000),
            ]},
            {"name": "Corolla", "class": "car", "generations": [
                (12, "E210 (2019–present)", 2019, None, "common",    300000),
                (11, "E170 (2014–2018)",    2014, 2018, "common",    350000),
            ]},
            {"name": "RAV4", "class": "suv", "generations": [
                (5, "XA50 (2019–present)",  2019, None, "common",    430000),
                (4, "XA40 (2013–2018)",     2013, 2018, "common",    350000),
            ]},
            {"name": "Tacoma", "class": "truck", "generations": [
                (3, "3rd Gen (2016–present)", 2016, None, "common",  270000),
                (2, "2nd Gen (2005–2015)",    2005, 2015, "common",  200000),
            ]},
            {"name": "Highlander", "class": "suv", "generations": [
                (4, "XU70 (2020–present)", 2020, None, "common",     240000),
                (3, "XU50 (2014–2019)",    2014, 2019, "common",     220000),
            ]},
            {"name": "Tundra", "class": "truck", "generations": [
                (3, "3rd Gen (2022–present)", 2022, None, "common",  100000),
                (2, "2nd Gen (2007–2021)",    2007, 2021, "common",  120000),
            ]},
            {"name": "Prius", "class": "car", "generations": [
                (5, "XW60 (2023–present)", 2023, None, "uncommon",   80000),
                (4, "XW50 (2016–2022)",    2016, 2022, "common",    100000),
            ]},
            {"name": "4Runner", "class": "suv", "generations": [
                (5, "N280 (2010–present)", 2010, None, "uncommon",   90000),
            ]},
            {"name": "Supra", "class": "car", "generations": [
                (5, "A90 (2019–present)",  2019, None, "epic",       10000),
            ]},
            {"name": "GR86", "class": "car", "generations": [
                (2, "ZN8 (2022–present)",  2022, None, "rare",       15000),
                (1, "ZN6 (2012–2021)",     2012, 2021, "rare",       12000),
            ]},
        ],
    },
    {
        "make": "Honda", "country": "JP",
        "models": [
            {"name": "Civic", "class": "car", "generations": [
                (11, "11th Gen (2022–present)", 2022, None, "common",  310000),
                (10, "10th Gen (2016–2021)",    2016, 2021, "common",  320000),
            ]},
            {"name": "Accord", "class": "car", "generations": [
                (11, "11th Gen (2023–present)", 2023, None, "common",  200000),
                (10, "10th Gen (2018–2022)",    2018, 2022, "common",  220000),
            ]},
            {"name": "CR-V", "class": "suv", "generations": [
                (6, "6th Gen (2023–present)", 2023, None, "common",   380000),
                (5, "5th Gen (2017–2022)",    2017, 2022, "common",   400000),
            ]},
            {"name": "Pilot", "class": "suv", "generations": [
                (4, "4th Gen (2023–present)", 2023, None, "common",   100000),
            ]},
            {"name": "Civic Type R", "class": "car", "generations": [
                (6, "FL5 (2022–present)",  2022, None, "epic",   10000),
                (5, "FK8 (2017–2021)",     2017, 2021, "epic",    8000),
            ]},
            {"name": "Ridgeline", "class": "truck", "generations": [
                (2, "2nd Gen (2017–present)", 2017, None, "uncommon", 80000),
            ]},
        ],
    },
    {
        "make": "Ford", "country": "US",
        "models": [
            {"name": "F-150", "class": "truck", "generations": [
                (14, "P702 (2021–present)",  2021, None, "common",  650000),
                (13, "P552 (2015–2020)",     2015, 2020, "common",  700000),
            ]},
            {"name": "Mustang", "class": "car", "generations": [
                (7, "7th Gen (2024–present)", 2024, None, "rare",    50000),
                (6, "S550 (2015–2023)",       2015, 2023, "uncommon", 80000),
            ]},
            {"name": "Explorer", "class": "suv", "generations": [
                (6, "6th Gen (2020–present)", 2020, None, "common",  230000),
            ]},
            {"name": "Bronco", "class": "suv", "generations": [
                (7, "7th Gen (2021–present)", 2021, None, "uncommon", 90000),
            ]},
            {"name": "Maverick", "class": "truck", "generations": [
                (1, "1st Gen (2022–present)", 2022, None, "uncommon", 80000),
            ]},
            {"name": "Escape", "class": "suv", "generations": [
                (4, "4th Gen (2020–present)", 2020, None, "common",  200000),
            ]},
        ],
    },
    {
        "make": "Chevrolet", "country": "US",
        "models": [
            {"name": "Silverado 1500", "class": "truck", "generations": [
                (4, "T1 (2019–present)",  2019, None, "common",   500000),
                (3, "K2 (2014–2018)",     2014, 2018, "common",   550000),
            ]},
            {"name": "Equinox", "class": "suv", "generations": [
                (3, "3rd Gen (2018–present)", 2018, None, "common", 300000),
            ]},
            {"name": "Tahoe", "class": "suv", "generations": [
                (5, "5th Gen (2021–present)", 2021, None, "common", 100000),
            ]},
            {"name": "Colorado", "class": "truck", "generations": [
                (3, "3rd Gen (2023–present)", 2023, None, "uncommon", 60000),
                (2, "2nd Gen (2015–2022)",    2015, 2022, "common",   100000),
            ]},
            {"name": "Corvette", "class": "car", "generations": [
                (8, "C8 (2020–present)",  2020, None, "epic",  35000),
                (7, "C7 (2014–2019)",     2014, 2019, "rare",  30000),
            ]},
            {"name": "Malibu", "class": "car", "generations": [
                (9, "9th Gen (2016–2024)", 2016, 2024, "common", 180000),
            ]},
        ],
    },
    {
        "make": "BMW", "country": "DE",
        "models": [
            {"name": "3 Series", "class": "car", "generations": [
                (7, "G20 (2019–present)", 2019, None, "uncommon", 120000),
                (6, "F30 (2012–2018)",    2012, 2018, "uncommon", 130000),
            ]},
            {"name": "5 Series", "class": "car", "generations": [
                (8, "G60 (2024–present)", 2024, None, "uncommon",  80000),
                (7, "G30 (2017–2023)",    2017, 2023, "uncommon",  90000),
            ]},
            {"name": "X3", "class": "suv", "generations": [
                (3, "G01 (2018–present)", 2018, None, "uncommon", 100000),
            ]},
            {"name": "X5", "class": "suv", "generations": [
                (4, "G05 (2019–present)", 2019, None, "uncommon",  90000),
            ]},
            {"name": "M3", "class": "car", "generations": [
                (6, "G80 (2021–present)", 2021, None, "epic",   10000),
                (5, "F80 (2014–2020)",    2014, 2020, "epic",   12000),
            ]},
            {"name": "M4", "class": "car", "generations": [
                (2, "G82 (2021–present)", 2021, None, "epic",   8000),
            ]},
        ],
    },
    {
        "make": "Mercedes-Benz", "country": "DE",
        "models": [
            {"name": "C-Class", "class": "car", "generations": [
                (5, "W206 (2022–present)", 2022, None, "uncommon", 100000),
                (4, "W205 (2015–2021)",    2015, 2021, "uncommon", 120000),
            ]},
            {"name": "E-Class", "class": "car", "generations": [
                (6, "W214 (2024–present)", 2024, None, "uncommon",  70000),
                (5, "W213 (2017–2023)",    2017, 2023, "uncommon",  80000),
            ]},
            {"name": "GLE", "class": "suv", "generations": [
                (2, "W167 (2020–present)", 2020, None, "uncommon",  90000),
            ]},
            {"name": "G-Class", "class": "suv", "generations": [
                (2, "W463A (2019–present)", 2019, None, "epic",  12000),
            ]},
            {"name": "AMG GT", "class": "car", "generations": [
                (2, "C192 (2023–present)", 2023, None, "epic",   3000),
            ]},
        ],
    },
    {
        "make": "Audi", "country": "DE",
        "models": [
            {"name": "A4", "class": "car", "generations": [
                (5, "B9 (2017–present)", 2017, None, "uncommon", 80000),
            ]},
            {"name": "Q5", "class": "suv", "generations": [
                (2, "FY (2018–present)", 2018, None, "uncommon", 110000),
            ]},
            {"name": "A6", "class": "car", "generations": [
                (5, "C8 (2019–present)", 2019, None, "uncommon",  60000),
            ]},
            {"name": "R8", "class": "car", "generations": [
                (2, "Type 4S (2016–present)", 2016, None, "legendary", 2000),
            ]},
            {"name": "RS3", "class": "car", "generations": [
                (4, "8Y (2022–present)", 2022, None, "epic", 5000),
            ]},
        ],
    },
    {
        "make": "Volkswagen", "country": "DE",
        "models": [
            {"name": "Jetta", "class": "car", "generations": [
                (7, "7th Gen (2019–present)", 2019, None, "common", 100000),
            ]},
            {"name": "Tiguan", "class": "suv", "generations": [
                (2, "2nd Gen (2018–present)", 2018, None, "common",  90000),
            ]},
            {"name": "Golf GTI", "class": "car", "generations": [
                (8, "Mk8 (2022–present)",  2022, None, "rare",   25000),
                (7, "Mk7 (2015–2021)",     2015, 2021, "rare",   30000),
            ]},
            {"name": "Golf R", "class": "car", "generations": [
                (4, "Mk8R (2022–present)", 2022, None, "epic",  10000),
            ]},
        ],
    },
    {
        "make": "Tesla", "country": "US",
        "models": [
            {"name": "Model 3", "class": "car", "generations": [
                (2, "Highland (2024–present)", 2024, None, "uncommon", 200000),
                (1, "Gen 1 (2017–2023)",       2017, 2023, "uncommon", 180000),
            ]},
            {"name": "Model Y", "class": "suv", "generations": [
                (2, "Juniper (2025–present)", 2025, None, "uncommon", 500000),
                (1, "Gen 1 (2020–2024)",      2020, 2024, "uncommon", 600000),
            ]},
            {"name": "Model S", "class": "car", "generations": [
                (2, "Plaid Era (2021–present)", 2021, None, "rare",   35000),
            ]},
            {"name": "Cybertruck", "class": "truck", "generations": [
                (1, "Gen 1 (2024–present)", 2024, None, "epic",  50000),
            ]},
        ],
    },
    {
        "make": "Jeep", "country": "US",
        "models": [
            {"name": "Wrangler", "class": "suv", "generations": [
                (4, "JL (2018–present)", 2018, None, "uncommon", 200000),
                (3, "JK (2007–2017)",    2007, 2017, "common",   180000),
            ]},
            {"name": "Grand Cherokee", "class": "suv", "generations": [
                (5, "WL (2021–present)",  2021, None, "common",  170000),
                (4, "WK2 (2011–2021)",    2011, 2021, "common",  200000),
            ]},
            {"name": "Gladiator", "class": "truck", "generations": [
                (1, "JT (2020–present)", 2020, None, "uncommon",  60000),
            ]},
        ],
    },
    {
        "make": "Ram", "country": "US",
        "models": [
            {"name": "1500", "class": "truck", "generations": [
                (5, "DT (2019–present)", 2019, None, "common",  400000),
                (4, "DS (2009–2018)",    2009, 2018, "common",  350000),
            ]},
        ],
    },
    {
        "make": "GMC", "country": "US",
        "models": [
            {"name": "Sierra 1500", "class": "truck", "generations": [
                (4, "T1 (2019–present)", 2019, None, "common",  200000),
            ]},
            {"name": "Yukon", "class": "suv", "generations": [
                (5, "5th Gen (2021–present)", 2021, None, "common",  80000),
            ]},
        ],
    },
    {
        "make": "Dodge", "country": "US",
        "models": [
            {"name": "Challenger", "class": "car", "generations": [
                (3, "LC (2008–2023)", 2008, 2023, "uncommon", 70000),
            ]},
            {"name": "Charger", "class": "car", "generations": [
                (7, "LD (2011–2023)", 2011, 2023, "uncommon", 100000),
            ]},
        ],
    },
    {
        "make": "Subaru", "country": "JP",
        "models": [
            {"name": "Outback", "class": "suv", "generations": [
                (6, "6th Gen (2020–present)", 2020, None, "common",  100000),
                (5, "5th Gen (2015–2019)",    2015, 2019, "common",   90000),
            ]},
            {"name": "Forester", "class": "suv", "generations": [
                (5, "SK (2019–present)", 2019, None, "common",  80000),
            ]},
            {"name": "WRX", "class": "car", "generations": [
                (5, "VB (2022–present)", 2022, None, "rare",  15000),
                (4, "VA (2015–2021)",    2015, 2021, "rare",  20000),
            ]},
            {"name": "BRZ", "class": "car", "generations": [
                (2, "ZD8 (2022–present)", 2022, None, "rare",   8000),
                (1, "ZC6 (2013–2021)",    2013, 2021, "rare",  10000),
            ]},
        ],
    },
    {
        "make": "Nissan", "country": "JP",
        "models": [
            {"name": "Altima", "class": "car", "generations": [
                (6, "6th Gen (2019–present)", 2019, None, "common",  200000),
            ]},
            {"name": "Rogue", "class": "suv", "generations": [
                (3, "3rd Gen (2021–present)", 2021, None, "common",  350000),
            ]},
            {"name": "Frontier", "class": "truck", "generations": [
                (3, "3rd Gen (2022–present)", 2022, None, "common",   60000),
            ]},
            {"name": "GT-R", "class": "car", "generations": [
                (2, "R35 (2007–present)", 2007, None, "legendary",  1500),
            ]},
            {"name": "Z", "class": "car", "generations": [
                (7, "RZ34 (2023–present)", 2023, None, "rare",   8000),
                (6, "Z34 (2009–2020)",     2009, 2020, "uncommon", 12000),
            ]},
        ],
    },
    {
        "make": "Hyundai", "country": "KR",
        "models": [
            {"name": "Sonata", "class": "car", "generations": [
                (8, "DN8 (2020–present)", 2020, None, "common",  200000),
            ]},
            {"name": "Tucson", "class": "suv", "generations": [
                (4, "NX4 (2022–present)", 2022, None, "common",  250000),
            ]},
            {"name": "Elantra", "class": "car", "generations": [
                (7, "CN7 (2021–present)", 2021, None, "common",  200000),
            ]},
            {"name": "Ioniq 5", "class": "suv", "generations": [
                (1, "NE1 (2022–present)", 2022, None, "uncommon",  60000),
            ]},
            {"name": "Ioniq 6", "class": "car", "generations": [
                (1, "CE1 (2023–present)", 2023, None, "uncommon",  30000),
            ]},
        ],
    },
    {
        "make": "Kia", "country": "KR",
        "models": [
            {"name": "Telluride", "class": "suv", "generations": [
                (1, "ON (2020–present)", 2020, None, "uncommon", 100000),
            ]},
            {"name": "Sportage", "class": "suv", "generations": [
                (5, "NQ5 (2023–present)", 2023, None, "common", 200000),
            ]},
            {"name": "K5", "class": "car", "generations": [
                (3, "DL3 (2021–present)", 2021, None, "common", 100000),
            ]},
            {"name": "Stinger", "class": "car", "generations": [
                (1, "CK (2018–2023)", 2018, 2023, "rare",  15000),
            ]},
            {"name": "EV6", "class": "suv", "generations": [
                (1, "CV (2022–present)", 2022, None, "uncommon", 30000),
            ]},
        ],
    },
    {
        "make": "Mazda", "country": "JP",
        "models": [
            {"name": "CX-5", "class": "suv", "generations": [
                (2, "KF (2017–present)", 2017, None, "common",  300000),
            ]},
            {"name": "Mazda3", "class": "car", "generations": [
                (4, "BP (2019–present)", 2019, None, "common",  100000),
            ]},
            {"name": "MX-5 Miata", "class": "car", "generations": [
                (4, "ND (2016–present)", 2016, None, "rare",  10000),
                (3, "NC (2006–2015)",    2006, 2015, "rare",   9000),
            ]},
            {"name": "CX-50", "class": "suv", "generations": [
                (1, "1st Gen (2023–present)", 2023, None, "common",  80000),
            ]},
        ],
    },
    {
        "make": "Lexus", "country": "JP",
        "models": [
            {"name": "RX", "class": "suv", "generations": [
                (5, "AL30 (2023–present)", 2023, None, "uncommon",  90000),
                (4, "AL20 (2016–2022)",    2016, 2022, "uncommon", 100000),
            ]},
            {"name": "IS", "class": "car", "generations": [
                (3, "XE30 (2014–present)", 2014, None, "uncommon",  40000),
            ]},
            {"name": "LC 500", "class": "car", "generations": [
                (1, "Z100 (2017–present)", 2017, None, "epic",   3000),
            ]},
        ],
    },
    {
        "make": "Porsche", "country": "DE",
        "models": [
            {"name": "911", "class": "car", "generations": [
                (8, "992 (2019–present)", 2019, None, "epic",   30000),
                (7, "991 (2012–2019)",    2012, 2019, "epic",   25000),
            ]},
            {"name": "Cayenne", "class": "suv", "generations": [
                (3, "PO536 (2018–present)", 2018, None, "rare",  40000),
            ]},
            {"name": "Macan", "class": "suv", "generations": [
                (2, "J1 EV (2024–present)", 2024, None, "uncommon", 30000),
            ]},
            {"name": "Taycan", "class": "car", "generations": [
                (1, "J1 (2020–present)", 2020, None, "rare",  20000),
            ]},
        ],
    },
    {
        "make": "Cadillac", "country": "US",
        "models": [
            {"name": "Escalade", "class": "suv", "generations": [
                (5, "5th Gen (2021–present)", 2021, None, "rare",  30000),
            ]},
            {"name": "CT5-V Blackwing", "class": "car", "generations": [
                (1, "2022–present", 2022, None, "epic",   2000),
            ]},
        ],
    },
    {
        "make": "Lamborghini", "country": "IT",
        "models": [
            {"name": "Huracán", "class": "car", "generations": [
                (1, "LP 580/610 (2014–present)", 2014, None, "legendary", 2500),
            ]},
            {"name": "Urus", "class": "suv", "generations": [
                (1, "1st Gen (2018–present)", 2018, None, "epic",  4000),
            ]},
        ],
    },
    {
        "make": "Ferrari", "country": "IT",
        "models": [
            {"name": "Roma", "class": "car", "generations": [
                (1, "F169 (2020–present)", 2020, None, "legendary", 1500),
            ]},
            {"name": "SF90 Stradale", "class": "car", "generations": [
                (1, "F173 (2021–present)", 2021, None, "legendary",  800),
            ]},
        ],
    },
    {
        "make": "McLaren", "country": "GB",
        "models": [
            {"name": "720S", "class": "car", "generations": [
                (1, "P14 (2017–present)", 2017, None, "legendary",  800),
            ]},
            {"name": "Artura", "class": "car", "generations": [
                (1, "MC30 (2022–present)", 2022, None, "legendary",  600),
            ]},
        ],
    },
]


def seed():
    db = create_client(SUPABASE_URL, SUPABASE_KEY)
    total_makes = total_models = total_gens = 0

    for entry in SEED:
        # Upsert make
        make_res = db.table("makes").upsert(
            {"name": entry["make"], "country": entry["country"]},
            on_conflict="name",
        ).execute()
        make_id = make_res.data[0]["id"]
        total_makes += 1
        print(f"  make: {entry['make']} ({make_id[:8]}…)")

        for model_entry in entry["models"]:
            # Upsert model
            model_res = db.table("models").upsert(
                {"make_id": make_id, "name": model_entry["name"], "class": model_entry["class"]},
                on_conflict="make_id,name",
            ).execute()
            model_id = model_res.data[0]["id"]
            total_models += 1

            for (gen_num, name, yr_start, yr_end, rarity, volume) in model_entry["generations"]:
                db.table("generations").upsert(
                    {
                        "model_id":                model_id,
                        "generation_number":       gen_num,
                        "common_name":             name,
                        "year_start":              yr_start,
                        "year_end":                yr_end,
                        "rarity_tier":             rarity,
                        "production_volume_annual": volume,
                        "production_volume_source": "estimate",
                    },
                    on_conflict="model_id,generation_number",
                ).execute()
                total_gens += 1
                print(f"    gen: {name} [{rarity}]")

    print(f"\nSeeded {total_makes} makes, {total_models} models, {total_gens} generations.")


if __name__ == "__main__":
    seed()
