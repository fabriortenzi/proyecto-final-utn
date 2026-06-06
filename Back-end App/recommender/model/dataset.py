import torch
from torch.utils.data import Dataset
import random


class InteractionsDataset(Dataset):
    NEG_SAMPLES = 4

    def __init__(self, interactions_df, all_shop_ids, user_features,
                 shop_features, user2idx, shop2idx):
        self.user2idx      = user2idx
        self.shop2idx      = shop2idx
        self.user_features = user_features
        self.shop_features = shop_features

        user_shops = interactions_df.groupby("userId")["shopId"].apply(set).to_dict()
        self.pairs = []

        for _, row in interactions_df.iterrows():
            uid, sid = row["userId"], row["shopId"]
            self.pairs.append((uid, sid, 1.0))
            negatives = [s for s in all_shop_ids if s not in user_shops.get(uid, set())]
            for neg in random.sample(negatives, min(self.NEG_SAMPLES, len(negatives))):
                self.pairs.append((uid, neg, 0.0))

    def __len__(self):
        return len(self.pairs)

    def __getitem__(self, idx):
        uid, sid, label = self.pairs[idx]
        uf = self.user_features.get(uid, {"shoptypes": [0], "categories": [0]})
        sf = self.shop_features.get(sid, {"shoptype": 0, "categories": [0],
                                          "stars": 0.0, "shipping_price": 0.0, "prep_time": 0.0})
        return {
            "user_id":         torch.tensor(self.user2idx.get(uid, 0), dtype=torch.long),
            "user_shoptypes":  torch.tensor(uf["shoptypes"],            dtype=torch.long),
            "user_categories": torch.tensor(uf["categories"],           dtype=torch.long),
            "shop_id":         torch.tensor(self.shop2idx.get(sid, 0), dtype=torch.long),
            "shop_shoptype":   torch.tensor(sf["shoptype"],             dtype=torch.long),
            "shop_categories": torch.tensor(sf["categories"],           dtype=torch.long),
            "shop_numeric":    torch.tensor([sf["stars"], sf["shipping_price"], sf["prep_time"]], dtype=torch.float),
            "label":           torch.tensor(label,                      dtype=torch.float),
        }


def collate_fn(batch):
    def pad(seqs):
        max_len = max(len(s) for s in seqs)
        return torch.stack([
            torch.cat([s, torch.zeros(max_len - len(s), dtype=torch.long)])
            for s in seqs
        ])

    return {
        "user_id":         torch.stack([b["user_id"]         for b in batch]),
        "user_shoptypes":  pad([b["user_shoptypes"]           for b in batch]),
        "user_categories": pad([b["user_categories"]          for b in batch]),
        "shop_id":         torch.stack([b["shop_id"]         for b in batch]),
        "shop_shoptype":   torch.stack([b["shop_shoptype"]   for b in batch]),
        "shop_categories": pad([b["shop_categories"]          for b in batch]),
        "shop_numeric":    torch.stack([b["shop_numeric"]    for b in batch]),
        "label":           torch.stack([b["label"]           for b in batch]),
    }