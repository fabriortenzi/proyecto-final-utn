import torch, pickle, faiss, numpy as np
from config import MODEL_PATH
from model.architecture import TwoTowerModel, EMBED_DIM


class Recommender:
    def __init__(self):
        with open(f"{MODEL_PATH}/encoders.pkl", "rb") as f:
            d = pickle.load(f)

        self.user2idx      = d["user2idx"]
        self.shop2idx      = d["shop2idx"]
        self.shoptype2idx  = d["shoptype2idx"]
        self.category2idx  = d["category2idx"]
        self.user_features = d["user_features"]
        self.shop_features = d["shop_features"]

        self.model = TwoTowerModel(
            n_users=len(self.user2idx), n_shops=len(self.shop2idx),
            n_shoptypes=len(self.shoptype2idx), n_categories=len(self.category2idx),
        )
        self.model.load_state_dict(torch.load(f"{MODEL_PATH}/model.pt", map_location="cpu"))
        self.model.eval()
        self._build_index()

    def _build_index(self):
        self.idx_to_shopid = list(self.shop2idx.keys())
        vectors = []
        for sid in self.idx_to_shopid:
            sf = self.shop_features.get(sid, {"shoptype": 0, "categories": [0],
                                              "stars": 0.0, "shipping_price": 0.0, "prep_time": 0.0})
            vec = self.model.get_shop_vector(
                torch.tensor([self.shop2idx[sid]]),
                torch.tensor([sf["shoptype"]]),
                torch.tensor([sf["categories"]]),
                torch.tensor([[sf["stars"], sf["shipping_price"], sf["prep_time"]]]),
            ).squeeze().numpy()
            vectors.append(vec)

        matrix = np.array(vectors).astype("float32")
        faiss.normalize_L2(matrix)
        self.index = faiss.IndexFlatIP(EMBED_DIM)
        self.index.add(matrix)

    def recommend(self, user_id: str, top_k: int = 3) -> list:
        if user_id not in self.user2idx:
            return self._top_rated(top_k)

        uf = self.user_features.get(user_id, {"shoptypes": [0], "categories": [0]})
        vec = self.model.get_user_vector(
            torch.tensor([self.user2idx[user_id]]),
            torch.tensor([uf["shoptypes"]]),
            torch.tensor([uf["categories"]]),
        ).squeeze().numpy().astype("float32")

        faiss.normalize_L2(vec.reshape(1, -1))
        scores, indices = self.index.search(vec.reshape(1, -1), top_k)

        return [
            {"shopId": self.idx_to_shopid[i], "score": round(float(s), 4)}
            for i, s in zip(indices[0], scores[0])
        ]

    def _top_rated(self, top_k):
        ranked = sorted(self.shop_features.items(),
                        key=lambda x: x[1].get("stars", 0), reverse=True)
        return [{"shopId": sid, "score": None} for sid, _ in ranked[:top_k]]