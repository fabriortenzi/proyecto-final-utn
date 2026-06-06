import torch
import torch.nn as nn
from torch.utils.data import DataLoader, random_split
import pickle, os
from pymongo import MongoClient
from config import MONGO_URI, MONGO_DB, MODEL_PATH
from data.preparation import (load_data, resolve_order_shops, resolve_order_categories,
                               build_interactions, build_encoders,
                               get_user_features, get_shop_features)
from data.seed import run as seed
from model.architecture import TwoTowerModel
from model.dataset import InteractionsDataset, collate_fn


def train():
    print("🌱 Verificando seed...")
    mongo = MongoClient(MONGO_URI)
    seed(mongo[MONGO_DB])
    mongo.close()

    print("📦 Cargando datos...")
    data = load_data()

    order_shops      = resolve_order_shops(data)
    order_categories = resolve_order_categories(data)
    interactions     = build_interactions(order_shops, data["reviews"])

    if interactions.empty:
        print("❌ Sin interacciones")
        return

    user2idx, shop2idx, shoptype2idx, category2idx = build_encoders(data, interactions)
    user_features = get_user_features(interactions, order_categories, data["shops"],
                                      shoptype2idx, category2idx, user2idx)
    shop_features = get_shop_features(data["shops"], data["products"],
                                      shop2idx, shoptype2idx, category2idx)

    print(f"✅ {len(user2idx)} usuarios | {len(shop2idx)} shops | "
          f"{len(shoptype2idx)} shopTypes | {len(category2idx)} categorías | "
          f"{len(interactions)} interacciones")

    all_shop_ids = list(shop2idx.keys())
    dataset = InteractionsDataset(interactions, all_shop_ids, user_features,
                                  shop_features, user2idx, shop2idx)

    train_size = int(0.8 * len(dataset))
    train_ds, val_ds = random_split(dataset, [train_size, len(dataset) - train_size])
    train_loader = DataLoader(train_ds, batch_size=64, shuffle=True,  collate_fn=collate_fn)
    val_loader   = DataLoader(val_ds,   batch_size=64, shuffle=False, collate_fn=collate_fn)

    model = TwoTowerModel(
        n_users=len(user2idx), n_shops=len(shop2idx),
        n_shoptypes=len(shoptype2idx), n_categories=len(category2idx),
    )
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)
    loss_fn   = nn.BCEWithLogitsLoss()
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, patience=3, factor=0.5)

    best_val = float("inf")

    for epoch in range(30):
        model.train()
        train_loss = 0
        for b in train_loader:
            scores = model(b["user_id"], b["user_shoptypes"], b["user_categories"],
                          b["shop_id"],  b["shop_shoptype"],  b["shop_categories"], b["shop_numeric"])
            loss = loss_fn(scores, b["label"])
            loss.backward()
            optimizer.step()
            optimizer.zero_grad()
            train_loss += loss.item()

        model.eval()
        val_loss = 0
        with torch.no_grad():
            for b in val_loader:
                scores = model(b["user_id"], b["user_shoptypes"], b["user_categories"],
                               b["shop_id"],  b["shop_shoptype"],  b["shop_categories"], b["shop_numeric"])
                val_loss += loss_fn(scores, b["label"]).item()

        train_loss /= len(train_loader)
        val_loss   /= len(val_loader)
        scheduler.step(val_loss)
        print(f"Época {epoch+1:02d} | train: {train_loss:.4f} | val: {val_loss:.4f}")

        if val_loss < best_val:
            best_val = val_loss
            _save(model, user2idx, shop2idx, shoptype2idx, category2idx, user_features, shop_features)
            print("Guardado")

    print("Finalizado")


def _save(model, user2idx, shop2idx, shoptype2idx, category2idx, user_features, shop_features):
    os.makedirs(MODEL_PATH, exist_ok=True)
    torch.save(model.state_dict(), f"{MODEL_PATH}/model.pt")
    with open(f"{MODEL_PATH}/encoders.pkl", "wb") as f:
        pickle.dump({
            "user2idx": user2idx, "shop2idx": shop2idx,
            "shoptype2idx": shoptype2idx, "category2idx": category2idx,
            "user_features": user_features, "shop_features": shop_features,
        }, f)


if __name__ == "__main__":
    train()