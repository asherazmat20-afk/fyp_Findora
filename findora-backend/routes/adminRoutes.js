const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/requireAdmin");
const { getAllUsersAdmin, deleteUserAdmin } = require("../controllers/userController");

router.get("/users", authMiddleware, requireAdmin, getAllUsersAdmin);
router.delete("/users/:id", authMiddleware, requireAdmin, deleteUserAdmin);

module.exports = router;
