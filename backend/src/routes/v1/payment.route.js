const express = require("express");
const auth = require("../../middlewares/auth");
const validate = require("../../middlewares/validate");
const paymentValidation = require("../../validations/payment.validation");
const { paymentController } = require("../../controllers");

const router = express.Router();

/**
 * @swagger
 * /payments:
 *   get:
 *     summary: List payments (paginated, newest paidAt first)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [paid, unpaid]
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           example: "2026-10-01"
 *         description: paidAt on or after this date (unpaid payments have no paidAt)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           example: "2026-10-31"
 *         description: paidAt on or before this date
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
 *         description: Returns results (payment with customerId, customerName, renewalId), page, limit, totalPages, totalResults
 *       "400":
 *         description: Validation error
 *       "401":
 *         description: Please authenticate
 */
router.get("/", auth("admin"), validate(paymentValidation.getPayments), paymentController.listPayments);

module.exports = router;