import pandas as pd
import numpy as np
from pymongo import MongoClient
from config import MONGO_URI, MONGO_DB


def load_data():
    client = MongoClient(MONGO_URI)
    db = client[MONGO_DB]

    client_type = db["user-type"].find_one({"name": "client"})

    users = list(db["user"].find(
        {"userType": client_type["_id"]} if client_type else {},
        {"_id": 1}
    ))

    shops = list(db["shop"].find({}, {
        "_id": 1, "shopType": 1,
        "totalReviews": 1, "totalStars": 1,
        "shippingPrice": 1, "preparationTime": 1
    }))

    shop_types = list(db["shop-type"].find({}, {"_id": 1, "name": 1}))

    product_categories = list(db["product-category"].find({}, {"_id": 1, "description": 1}))

    products = list(db["product"].find({}, {"_id": 1, "shop": 1, "productCategory": 1}))

    line_items = list(db["line-item"].find({}, {"_id": 1, "order": 1, "product": 1}))

    orders = list(db["order"].find(
        {"dateTimeArrival": {"$exists": True}},
        {"_id": 1, "client": 1}
    ))

    reviews = list(db["review"].find({}, {"_id": 1, "user": 1, "shop": 1, "stars": 1}))

    client.close()

    return {
        "users":              pd.DataFrame(users),
        "shops":              pd.DataFrame(shops),
        "shop_types":         pd.DataFrame(shop_types),
        "product_categories": pd.DataFrame(product_categories),
        "products":           pd.DataFrame(products),
        "line_items":         pd.DataFrame(line_items),
        "orders":             pd.DataFrame(orders),
        "reviews":            pd.DataFrame(reviews),
    }


def resolve_order_shops(data: dict) -> pd.DataFrame:
    orders     = data["orders"].copy()
    line_items = data["line_items"].copy()
    products   = data["products"].copy()

    if orders.empty or line_items.empty or products.empty:
        return pd.DataFrame(columns=["orderId", "userId", "shopId"])

    orders["orderId"]     = orders["_id"].astype(str)
    orders["userId"]      = orders["client"].astype(str)
    line_items["orderId"] = line_items["order"].astype(str)
    line_items["prodId"]  = line_items["product"].astype(str)
    products["prodId"]    = products["_id"].astype(str)
    products["shopId"]    = products["shop"].astype(str)

    merged = (
        orders[["orderId", "userId"]]
        .merge(line_items[["orderId", "prodId"]], on="orderId", how="left")
        .merge(products[["prodId", "shopId"]], on="prodId", how="left")
        .dropna(subset=["shopId"])
        .drop_duplicates(subset=["orderId", "userId", "shopId"])
    )

    return merged[["orderId", "userId", "shopId"]]


def resolve_order_categories(data: dict) -> pd.DataFrame:
    orders     = data["orders"].copy()
    line_items = data["line_items"].copy()
    products   = data["products"].copy()

    if orders.empty or line_items.empty or products.empty:
        return pd.DataFrame(columns=["userId", "categoryId"])

    orders["orderId"]      = orders["_id"].astype(str)
    orders["userId"]       = orders["client"].astype(str)
    line_items["orderId"]  = line_items["order"].astype(str)
    line_items["prodId"]   = line_items["product"].astype(str)
    products["prodId"]     = products["_id"].astype(str)
    products["categoryId"] = products["productCategory"].astype(str)

    merged = (
        orders[["orderId", "userId"]]
        .merge(line_items[["orderId", "prodId"]], on="orderId", how="left")
        .merge(products[["prodId", "categoryId"]], on="prodId", how="left")
        .dropna(subset=["categoryId"])
    )

    return merged[["userId", "categoryId"]]


def build_interactions(order_shops_df: pd.DataFrame, reviews_df: pd.DataFrame) -> pd.DataFrame:
    interactions = {}

    for _, row in order_shops_df.iterrows():
        key = (str(row["userId"]), str(row["shopId"]))
        interactions[key] = interactions.get(key, 0) + 1.0

    if not reviews_df.empty:
        for _, row in reviews_df.iterrows():
            key = (str(row.get("user", "")), str(row.get("shop", "")))
            if not key[0] or not key[1]:
                continue
            stars = float(row.get("stars", 3))
            delta = (stars - 3) / 2
            interactions[key] = interactions.get(key, 0) + delta

    rows = [
        {"userId": k[0], "shopId": k[1], "raw_score": max(v, 0)}
        for k, v in interactions.items()
    ]
    if not rows:
        return pd.DataFrame(columns=["userId", "shopId", "score"])

    df = pd.DataFrame(rows)
    df = df[df["raw_score"] > 0]
    df["score"] = np.log1p(df["raw_score"])
    df["score"] /= df["score"].max() if df["score"].max() > 0 else 1
    return df


def build_encoders(data: dict, interactions_df: pd.DataFrame):
    user_ids     = data["users"]["_id"].astype(str).unique().tolist()
    shop_ids     = data["shops"]["_id"].astype(str).unique().tolist()
    shoptype_ids = data["shop_types"]["_id"].astype(str).unique().tolist()
    category_ids = data["product_categories"]["_id"].astype(str).unique().tolist()

    user2idx     = {uid: i+1 for i, uid in enumerate(user_ids)}
    shop2idx     = {sid: i+1 for i, sid in enumerate(shop_ids)}
    shoptype2idx = {st:  i+1 for i, st  in enumerate(shoptype_ids)}
    category2idx = {c:   i+1 for i, c   in enumerate(category_ids)}

    return user2idx, shop2idx, shoptype2idx, category2idx


def get_user_features(interactions_df, order_categories_df, shops_df,
                      shoptype2idx, category2idx, user2idx):
    shops_slim = shops_df[["_id", "shopType"]].copy()
    shops_slim["_id"]      = shops_slim["_id"].astype(str)
    shops_slim["shopType"] = shops_slim["shopType"].astype(str)

    merged = interactions_df.merge(
        shops_slim, left_on="shopId", right_on="_id", how="left"
    )

    features = {}
    for uid in user2idx:
        user_rows = merged[merged["userId"] == uid]
        top_shoptypes = (
            user_rows.groupby("shopType")["score"]
            .sum().nlargest(3).index.tolist()
        )

        cat_rows = order_categories_df[order_categories_df["userId"] == uid]
        top_categories = (
            cat_rows["categoryId"].value_counts()
            .head(5).index.tolist()
        )

        features[uid] = {
            "shoptypes":  [shoptype2idx.get(st, 0) for st in top_shoptypes]  or [0],
            "categories": [category2idx.get(c,  0) for c  in top_categories] or [0],
        }

    return features


def get_shop_features(shops_df, products_df, shop2idx, shoptype2idx, category2idx):
    products_df = products_df.copy()
    products_df["shopId"]     = products_df["shop"].astype(str)
    products_df["categoryId"] = products_df["productCategory"].astype(str)
    shop_categories = (
        products_df.groupby("shopId")["categoryId"]
        .apply(lambda x: list(x.unique()))
        .to_dict()
    )

    max_shipping = float(shops_df["shippingPrice"].max() or 1)
    max_prep     = float(shops_df["preparationTime"].max() or 1)

    features = {}
    for _, row in shops_df.iterrows():
        sid   = str(row["_id"])
        stars = float(row.get("totalStars", 0)) / max(float(row.get("totalReviews", 1)), 1)
        cats  = shop_categories.get(sid, [])

        features[sid] = {
            "shoptype":       shoptype2idx.get(str(row.get("shopType", "")), 0),
            "categories":     [category2idx.get(c, 0) for c in cats] or [0],
            "stars":          round(stars, 4),
            "shipping_price": round(float(row.get("shippingPrice", 0)) / max_shipping, 4),
            "prep_time":      round(float(row.get("preparationTime", 0)) / max_prep, 4),
        }

    return features