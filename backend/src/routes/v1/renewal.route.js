const express = require("express");
const auth = require("../../middlewares/auth");
const { renewalController } = require("../../controllers");

const router = express.Router();


router
  .route("/create")
  .post(auth("admin"), renewalController.createRenewal);
router
  .route("/extend-renewal")
  .patch(auth("admin"), renewalController.extendRenewal);

module.exports = router;