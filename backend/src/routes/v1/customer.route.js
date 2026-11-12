const express = require("express");
const auth = require("../../middlewares/auth");
const { customerController } = require("../../controllers");

const router = express.Router();

router.route("/create").post(auth("admin"), customerController.createCustomer);

module.exports = router;