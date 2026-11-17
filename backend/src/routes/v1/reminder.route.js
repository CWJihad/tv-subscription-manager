const express = require("express");
const auth = require("../../middlewares/auth");
const validate = require("../../middlewares/validate");
const reminderValidation = require("../../validations/reminder.validation");
const { reminderController } = require("../../controllers");

const router = express.Router();

/**
 * @swagger
 * /reminders/run:
 *   post:
 *     summary: Run the reminder engine now (ignores reminderSendHour). Real sending needs REMINDERS_ENABLED=true and DEMO_MODE=false
 *     tags: [Reminders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dryRun
 *         schema:
 *           type: boolean
 *           default: false
 *         description: true = only list what would happen, nothing is sent or saved
 *     responses:
 *       "200":
 *         description: Returns dryRun and items [{ customerId, type, channel, action }]
 *       "401":
 *         description: Please authenticate
 *       "403":
 *         description: Reminders are disabled (demo mode or REMINDERS_ENABLED=false)
 *       "409":
 *         description: A reminder run is already in progress
 */
router.post("/run", auth("admin"), validate(reminderValidation.runReminders), reminderController.run);

/**
 * @swagger
 * /reminders/digest:
 *   post:
 *     summary: Send the failed-reminders digest to the admin now (ignores the hour and the once-a-day check)
 *     tags: [Reminders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dryRun
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       "200":
 *         description: Returns dryRun, sent, failedCount, reason
 *       "401":
 *         description: Please authenticate
 *       "403":
 *         description: Reminders are disabled
 */
router.post("/digest", auth("admin"), validate(reminderValidation.runReminders), reminderController.digest);

/**
 * @swagger
 * /reminders/logs:
 *   get:
 *     summary: List reminder logs (paginated, newest first)
 *     tags: [Reminders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [sent, failed, skipped]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [d7, d3, d1, expired]
 *       - in: query
 *         name: channel
 *         schema:
 *           type: string
 *           enum: [email, whatsapp]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *     responses:
 *       "200":
 *         description: Returns results, page, limit, totalPages, totalResults
 *       "400":
 *         description: Validation error
 *       "401":
 *         description: Please authenticate
 */
router.get("/logs", auth("admin"), validate(reminderValidation.getLogs), reminderController.listLogs);

module.exports = router;