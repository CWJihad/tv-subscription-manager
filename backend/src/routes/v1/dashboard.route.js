const express = require("express");
const auth = require("../../middlewares/auth");
const { dashboardController } = require("../../controllers");

const router = express.Router();

/**
 * @swagger
 * /dashboard/summary:
 *   get:
 *     summary: Dashboard counts, expiring and expired lists, and this month's payment summary
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Returns today, counts, needsAttention, expiring (daysLeft asc), expired (most recent first, max 100 each), payments
 *       "401":
 *         description: Please authenticate
 */
router.get("/summary", auth("admin"), dashboardController.getSummary);

module.exports = router;