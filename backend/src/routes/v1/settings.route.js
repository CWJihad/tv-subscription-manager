const express = require("express");
const auth = require("../../middlewares/auth");
const validate = require("../../middlewares/validate");
const settingsValidation = require("../../validations/settings.validation");
const { settingsController } = require("../../controllers");

const router = express.Router();

/**
 * @swagger
 * /settings:
 *   get:
 *     summary: Get the reminder settings, templates and default prices
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Returns the settings
 *       "401":
 *         description: Please authenticate
 *   patch:
 *     summary: Partially update the settings (templates and prices merge field by field)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               remind7Days:
 *                 type: boolean
 *               remind3Days:
 *                 type: boolean
 *               remind1Day:
 *                 type: boolean
 *               remindExpired:
 *                 type: boolean
 *               reminderChannels:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [email, whatsapp]
 *               reminderStrategy:
 *                 type: string
 *                 enum: [both, whatsapp_then_email]
 *                 description: both = send on every selected channel. whatsapp_then_email = email only if WhatsApp fails
 *               reminderSendHour:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 23
 *               reminderTemplates:
 *                 type: object
 *                 description: d7, d3, d1, expired. Placeholders {firstName} and {date}
 *               prices:
 *                 type: object
 *                 description: m3, m6, m12 (number or null)
 *               failureDigestEnabled:
 *                 type: boolean
 *                 description: Daily email to the admin with reminders that could not be delivered
 *     responses:
 *       "200":
 *         description: Returns the updated settings
 *       "400":
 *         description: Validation error
 *       "401":
 *         description: Please authenticate
 */
router
  .route("/")
  .get(auth("admin"), settingsController.getSettings)
  .patch(auth("admin"), validate(settingsValidation.updateSettings), settingsController.updateSettings);

module.exports = router;