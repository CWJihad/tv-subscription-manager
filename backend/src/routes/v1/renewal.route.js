const express = require("express");
const auth = require("../../middlewares/auth");
const { renewalController } = require("../../controllers");

const router = express.Router();

router.route("/create").post(auth("admin"), renewalController.createCustomer);

module.exports = router;