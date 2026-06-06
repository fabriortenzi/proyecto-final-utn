import random
from datetime import datetime, timedelta
from bson import ObjectId
from pymongo import MongoClient
from config import MONGO_URI, MONGO_DB

MIN_INTERACTIONS = 300


def should_seed(db) -> bool:
    real      = db["order"].count_documents({"dateTimeArrival": {"$exists": True}, "isSynthetic": {"$exists": False}})
    synthetic = db["order"].count_documents({"isSynthetic": True})
    print(f"   Interacciones reales: {real} | sintéticas: {synthetic}")
    return (real + synthetic) < MIN_INTERACTIONS


def run(db):
    if not should_seed(db):
        print("Datos suficientes, sin seed")
        return

    client_type = db["user-type"].find_one({"name": "client"})
    users   = list(db["user"].find(
        {"userType": client_type["_id"]} if client_type else {},
        {"_id": 1}
    ))
    shops    = list(db["shop"].find({}, {"_id": 1, "shopType": 1}))
    products = list(db["product"].find({}, {"_id": 1, "shop": 1, "productCategory": 1}))

    if not users or not shops:
        print("Sin usuarios o shops para seed")
        return

    products_by_shop = {}
    for p in products:
        sid = str(p["shop"])
        products_by_shop.setdefault(sid, []).append(p)

    shops_by_type = {}
    for s in shops:
        st = str(s["shopType"])
        shops_by_type.setdefault(st, []).append(str(s["_id"]))

    shop_type_ids = list(shops_by_type.keys())
    synthetic_orders    = []
    synthetic_reviews   = []
    synthetic_lineitems = []

    for user in users:
        uid = user["_id"]
        fav_types = random.sample(shop_type_ids, min(2, len(shop_type_ids)))

        for _ in range(random.randint(10, 25)):
            chosen_type = random.choice(fav_types) if random.random() < 0.7 else random.choice(shop_type_ids)
            candidate_shops = shops_by_type.get(chosen_type, [])
            if not candidate_shops:
                continue

            shop_id    = ObjectId(random.choice(candidate_shops))
            order_date = datetime.now() - timedelta(days=random.randint(1, 120))
            order_id   = ObjectId()

            synthetic_orders.append({
                "_id":             order_id,
                "client":          uid,
                "dateTimeArrival": order_date,
                "createdAt":       order_date,
                "isSynthetic":     True,
            })

            shop_products = products_by_shop.get(str(shop_id), [])
            if shop_products:
                for prod in random.sample(shop_products, min(random.randint(1, 3), len(shop_products))):
                    synthetic_lineitems.append({
                        "order":       order_id,
                        "product":     prod["_id"],
                        "isSynthetic": True,
                    })

            if random.random() < 0.4:
                stars = (
                    random.choices([3, 4, 5], weights=[1, 3, 6])[0]
                    if chosen_type in fav_types
                    else random.choices([1, 2, 3, 4], weights=[2, 3, 3, 2])[0]
                )
                synthetic_reviews.append({
                    "user":        uid,
                    "shop":        shop_id,
                    "stars":       stars,
                    "comment":     "synthetic",
                    "dateTime":    order_date,
                    "isSynthetic": True,
                })

    if synthetic_orders:
        db["order"].insert_many(synthetic_orders)
        print(f"{len(synthetic_orders)} órdenes sintéticas")
    if synthetic_lineitems:
        db["line-item"].insert_many(synthetic_lineitems)
        print(f"{len(synthetic_lineitems)} lineItems sintéticos")
    if synthetic_reviews:
        db["review"].insert_many(synthetic_reviews)
        print(f"{len(synthetic_reviews)} reviews sintéticas")


if __name__ == "__main__":
    client = MongoClient(MONGO_URI)
    db = client[MONGO_DB]
    run(db)
    client.close()