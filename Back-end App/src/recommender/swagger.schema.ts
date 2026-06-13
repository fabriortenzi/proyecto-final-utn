/**
 * @swagger
 * components:
 *   schemas:
 *     Recommendation:
 *       type: object
 *       properties:
 *         shopId:
 *           type: string
 *           description: The ID of the recommended shop
 *         score:
 *           type: number
 *           nullable: true
 *           description: Affinity score between 0 and 1. Null for cold start users (no order history).
 *
 *   tags:
 *     - name: Recommendations
 *       description: Personalized shop recommendations based on order history and preferences
 */