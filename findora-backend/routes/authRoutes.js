const express = require("express");
const router = express.Router();
const { signup, login, getUserById, updateProfile } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/signup", signup);
router.post("/login", login);
router.get("/user/:id", getUserById);
router.put("/profile", authMiddleware, updateProfile);

module.exports = router;