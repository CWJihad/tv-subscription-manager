const express = require("express");
const auth = require("../../middlewares/auth");
const validate = require("../../middlewares/validate");
const customerValidation = require("../../validations/customer.validation");
const paymentValidation = require("../../validations/payment.validation");
const { customerController } = require("../../controllers");

const router = express.Router();

/**
 * @swagger
 * /customers/stats:
 *   get:
 *     summary: Status counts (total, active, expiring, expired, expiring buckets)
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Optional search on name, phone or email
 *     responses:
 *       "200":
 *         description: Returns total, active, expiring, expired and expiringBuckets
 *       "401":
 *         description: Please authenticate
 */
router.get("/stats", auth("admin"), validate(customerValidation.getCustomerStats), customerController.getCustomerStats);

/**
 * @swagger
 * /customers:
 *   get:
 *     summary: List customers (paginated)
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, active, expiring, expired]
 *       - in: query
 *         name: bucket
 *         schema:
 *           type: string
 *           enum: ["1-3", "4-7", "8-10"]
 *         description: Only used with status=expiring
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
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
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [name, -name, expiry, -expiry, since, -since]
 *     responses:
 *       "200":
 *         description: Returns results, page, limit, totalPages, totalResults
 *       "400":
 *         description: Validation error
 *       "401":
 *         description: Please authenticate
 *   post:
 *     summary: Create a customer with the first subscription period
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, phone, durationMonths]
 *             properties:
 *               fullName:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 example: "2026-10-05"
 *               durationMonths:
 *                 type: integer
 *                 enum: [3, 6, 12]
 *               payment:
 *                 type: object
 *                 properties:
 *                   amount:
 *                     type: number
 *                   method:
 *                     type: string
 *                     enum: [cash, bkash, nagad, rocket, bank_transfer, other]
 *                   status:
 *                     type: string
 *                     enum: [paid, unpaid]
 *                   paidAt:
 *                     type: string
 *                   note:
 *                     type: string
 *     responses:
 *       "201":
 *         description: Returns the customer detail
 *       "400":
 *         description: Validation error
 *       "401":
 *         description: Please authenticate
 *       "409":
 *         description: Phone number already exists
 */
router
  .route("/")
  .get(auth("admin"), validate(customerValidation.getCustomers), customerController.listCustomers)
  .post(auth("admin"), validate(customerValidation.createCustomer), customerController.createCustomer);

/**
 * @swagger
 * /customers/{id}/renew:
 *   post:
 *     summary: Renew a subscription (new expiry = max(current expiry, today) + months)
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [durationMonths]
 *             properties:
 *               durationMonths:
 *                 type: integer
 *                 enum: [3, 6, 12]
 *               payment:
 *                 type: object
 *                 properties:
 *                   amount:
 *                     type: number
 *                   method:
 *                     type: string
 *                     enum: [cash, bkash, nagad, rocket, bank_transfer, other]
 *                   status:
 *                     type: string
 *                     enum: [paid, unpaid]
 *                   paidAt:
 *                     type: string
 *                   note:
 *                     type: string
 *     responses:
 *       "200":
 *         description: Returns the customer detail
 *       "400":
 *         description: Validation error
 *       "401":
 *         description: Please authenticate
 *       "404":
 *         description: Customer not found
 *       "409":
 *         description: Subscription was changed. Refresh and try again.
 */
router.post("/:id/renew", auth("admin"), validate(customerValidation.renewCustomer), customerController.renewCustomer);

/**
 * @swagger
 * /customers/{id}/renewals/{renewalId}/payment:
 *   put:
 *     summary: Create or replace the payment of one renewal
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: renewalId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount:
 *                 type: number
 *               method:
 *                 type: string
 *                 enum: [cash, bkash, nagad, rocket, bank_transfer, other]
 *               status:
 *                 type: string
 *                 enum: [paid, unpaid]
 *                 default: paid
 *               paidAt:
 *                 type: string
 *                 example: "2026-10-05"
 *               note:
 *                 type: string
 *     responses:
 *       "200":
 *         description: Returns the renewal item with its payment
 *       "400":
 *         description: Validation error (paid needs amount > 0 and a method)
 *       "401":
 *         description: Please authenticate
 *       "404":
 *         description: Customer not found or Renewal not found
 */
router.put(
  "/:id/renewals/:renewalId/payment",
  auth("admin"),
  validate(paymentValidation.upsertPayment),
  customerController.upsertRenewalPayment
);

/**
 * @swagger
 * /customers/{id}:
 *   get:
 *     summary: Get one customer with renewals and payments
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       "200":
 *         description: Returns the customer detail
 *       "401":
 *         description: Please authenticate
 *       "404":
 *         description: Customer not found
 *   patch:
 *     summary: Update name, phone, email or remindersEnabled
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               remindersEnabled:
 *                 type: boolean
 *     responses:
 *       "200":
 *         description: Returns the customer detail
 *       "400":
 *         description: Validation error
 *       "401":
 *         description: Please authenticate
 *       "404":
 *         description: Customer not found
 *       "409":
 *         description: Phone number already exists
 *   delete:
 *     summary: Delete a customer permanently (cascades to renewals, payments, reminder logs)
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       "200":
 *         description: Returns the deleted id
 *       "401":
 *         description: Please authenticate
 *       "404":
 *         description: Customer not found
 */
router
  .route("/:id")
  .get(auth("admin"), validate(customerValidation.getCustomer), customerController.getCustomer)
  .patch(auth("admin"), validate(customerValidation.updateCustomer), customerController.updateCustomer)
  .delete(auth("admin"), validate(customerValidation.deleteCustomer), customerController.deleteCustomer);

module.exports = router;