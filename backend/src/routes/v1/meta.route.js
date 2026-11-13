const express = require("express");
const auth = require("../../middlewares/auth");
const { metaController } = require("../../controllers");

const router = express.Router();

/**
 * @swagger
 * /meta:
 *   get:
 *     summary: App constants and today's date (today comes from the backend clock or MOCK_TODAY)
 *     tags: [Meta]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Returns today, timezone, currency, expiringWindowDays
 *       "401":
 *         description: Please authenticate
 */
router.get("/", auth("admin"), metaController.getMeta);

module.exports = router;