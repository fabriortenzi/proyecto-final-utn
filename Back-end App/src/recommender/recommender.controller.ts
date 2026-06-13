import { Request, Response } from "express";
import axios from "axios";

const RECOMMENDER_URL = process.env.RECOMMENDER_URL || "http://recommender:8001";

export async function getRecommendations(req: Request, res: Response) {
  try {
    const userId = (req as any).token.id;

    const { data } = await axios.get(
      `${RECOMMENDER_URL}/recomendaciones/${userId}`,
      { timeout: 5000 }
    );

    return res.status(200).json({
      message: "Recommendations found",
      body: data.recomendaciones,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}