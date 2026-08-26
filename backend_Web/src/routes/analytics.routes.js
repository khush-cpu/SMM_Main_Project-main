// ==========================================
// FILE: src/routes/analytics.routes.js
// NEW: SMM ke "Analytics" tab ke liye — pehle ye route exist hi nahi
// karta tha, frontend GET /api/analytics call karta tha aur 404 aata
// tha. Mounted at /api/analytics in app.js.
// ==========================================

const router = require("express").Router();

const { getAnalytics } = require("../controllers/posts/analytics.controller");

const auth             = require("../middleware/auth.middleware");
const role             = require("../middleware/role.middleware");
const checkUserActive  = require("../middleware/checkUserActive.middleware");

router.use(auth, checkUserActive, role(["SMM"]));

// GET /api/analytics?period=7d|30d|90d&clientId=
router.get("/", getAnalytics);

module.exports = router;
