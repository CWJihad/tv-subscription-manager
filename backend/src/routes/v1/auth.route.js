const express = require("express");
const auth = require("../../middlewares/auth");
const validate = require("../../middlewares/validate");
const authValidation = require("../../validations/auth.validation");
const { authController } = require("../../controllers");

const router = express.Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Admin login (public)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       "200":
 *         description: Returns user and tokens
 *       "401":
 *         description: Incorrect email or password
 */
router.post("/login", validate(authValidation.login), authController.login);

/**
 * @swagger
 * /auth/refresh-tokens:
 *   post:
 *     summary: Exchange a refresh token for a new token pair (public, refresh token is single-use)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       "200":
 *         description: Returns new tokens
 *       "401":
 *         description: Please authenticate
 */
router.post("/refresh-tokens", validate(authValidation.refreshTokens), authController.refreshTokens);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out (deletes the refresh token)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       "200":
 *         description: Logged out
 *       "401":
 *         description: Please authenticate
 */
router.post("/logout", auth("admin"), validate(authValidation.logout), authController.logout);

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change the admin password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [oldPassword, newPassword]
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 description: At least 8 characters with a letter and a number
 *     responses:
 *       "200":
 *         description: Password changed
 *       "400":
 *         description: Validation error or incorrect old password
 *       "401":
 *         description: Please authenticate
 */
router.post("/change-password", auth("admin"), validate(authValidation.changePassword), authController.changePassword);

module.exports = router;