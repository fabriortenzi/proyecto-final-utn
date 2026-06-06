import { Router } from "express";
import { getRecommendations } from "./recommender.controller.js";
import { assureAuthAndRoles, UserTypeEnum } from "../shared/auth.middleware.js";

export const recommenderRouter = Router();

/**
 * @swagger
 * /api/recommendations:
 *   get:
 *     tags:
 *       - Recommendations
 *     summary: Get personalized shop recommendations
 *     description: Returns the top 3 recommended shops for the authenticated client based on their order history and preferences.
 *     responses:
 *       200:
 *         description: List of recommended shops
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 body:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Recommendation'
 *       503:
 *         description: Recommendation model not available
 *       500:
 *         description: Internal server error
 */
recommenderRouter.get(
  "/",
  assureAuthAndRoles([UserTypeEnum.client]),
  getRecommendations
);