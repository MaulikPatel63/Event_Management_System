const router = require("express").Router();

//! Auth Router
router.use("/api/v1/auth", require("./Auth.js"));

//! Auth Router
router.use("/api/v1/event", require("./Event.js"));

module.exports = router;
