const express = require("express");
const { payment } = require("../controllers/stripe");
const { authCheck } = require("../middlewares/authCheck");

const router = express.Router();

router.post("/user/create-payment-intent", authCheck, payment);

module.exports = router;
