const express = require("express");
const { healthController } = require("../../controllers");

const router = express.Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check (public)
 *     tags: [Health]
 *     responses:
 *       "200":
 *         description: Service is up
 */
router.get("/", healthController.getHealth);

module.exports = router;