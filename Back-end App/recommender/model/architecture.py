import torch
import torch.nn as nn
import torch.nn.functional as F

EMBED_DIM = 32

class UserTower(nn.Module):
    def __init__(self, n_users, n_shoptypes, n_categories):
        super().__init__()
        self.user_embed     = nn.Embedding(n_users + 1,      EMBED_DIM, padding_idx=0)
        self.shoptype_embed = nn.EmbeddingBag(n_shoptypes + 1, EMBED_DIM, mode="mean", padding_idx=0)
        self.category_embed = nn.EmbeddingBag(n_categories + 1, EMBED_DIM, mode="mean", padding_idx=0)

        self.mlp = nn.Sequential(
            nn.Linear(EMBED_DIM * 3, 128),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(128, EMBED_DIM),
        )

    def forward(self, user_id, shoptypes, categories):
        u = self.user_embed(user_id)
        s = self.shoptype_embed(shoptypes)
        c = self.category_embed(categories)
        return self.mlp(torch.cat([u, s, c], dim=-1))


class ShopTower(nn.Module):
    def __init__(self, n_shops, n_shoptypes, n_categories):
        super().__init__()
        self.shop_embed     = nn.Embedding(n_shops + 1,       EMBED_DIM, padding_idx=0)
        self.shoptype_embed = nn.Embedding(n_shoptypes + 1,   EMBED_DIM, padding_idx=0)
        self.category_embed = nn.EmbeddingBag(n_categories + 1, EMBED_DIM, mode="mean", padding_idx=0)
        # 3 features numéricas: stars, shippingPrice, preparationTime
        self.numeric_layer  = nn.Linear(3, EMBED_DIM)

        self.mlp = nn.Sequential(
            nn.Linear(EMBED_DIM * 4, 128),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(128, EMBED_DIM),
        )

    def forward(self, shop_id, shoptype, categories, numeric):
        s = self.shop_embed(shop_id)
        t = self.shoptype_embed(shoptype)
        c = self.category_embed(categories)
        n = torch.relu(self.numeric_layer(numeric))
        return self.mlp(torch.cat([s, t, c, n], dim=-1))


class TwoTowerModel(nn.Module):
    def __init__(self, n_users, n_shops, n_shoptypes, n_categories):
        super().__init__()
        self.user_tower = UserTower(n_users, n_shoptypes, n_categories)
        self.shop_tower = ShopTower(n_shops, n_shoptypes, n_categories)

    def forward(self, user_id, user_shoptypes, user_categories,
                shop_id, shop_shoptype, shop_categories, shop_numeric):
        uv = self.user_tower(user_id, user_shoptypes, user_categories)
        sv = self.shop_tower(shop_id, shop_shoptype, shop_categories, shop_numeric)
        return F.cosine_similarity(uv, sv)

    def get_user_vector(self, user_id, shoptypes, categories):
        with torch.no_grad():
            return self.user_tower(user_id, shoptypes, categories)

    def get_shop_vector(self, shop_id, shoptype, categories, numeric):
        with torch.no_grad():
            return self.shop_tower(shop_id, shoptype, categories, numeric)