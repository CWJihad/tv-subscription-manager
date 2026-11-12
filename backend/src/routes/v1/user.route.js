const express = require("express");
const auth = require("../../middlewares/auth");
const validate = require("../../middlewares/validate");
const userValidation = require("../../validations/user.validation");
const { userController } = require("../../controllers");

const router = express.Router();

/**
 * @swagger
 * /users/self/in:
 *   get:
 *     summary: Get the logged-in admin
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Returns id, fullName, email
 *       "401":
 *         description: Please authenticate
 */
router.get("/self/in", auth("admin"), userController.getProfile);

/**
 * @swagger
 * /users/self/update:
 *   patch:
 *     summary: Update the logged-in admin (name, email)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       "200":
 *         description: Returns the updated user
 *       "400":
 *         description: Validation error or email already taken
 *       "401":
 *         description: Please authenticate
 */
router.patch("/self/update", auth("admin"), validate(userValidation.updateProfile), userController.updateProfile);

module.exports = router;