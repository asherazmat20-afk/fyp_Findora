const express = require("express");
const router = express.Router();

const {
  createNotification,
  getNotifications,
  getMyNotifications,
  getUnreadNotificationCount,
  clearMyNotifications,
} = require("../controllers/notificationController");

const authMiddleware = require("../middleware/authMiddleware"); 

router.post("/create", authMiddleware, createNotification);
router.delete("/clear", authMiddleware, clearMyNotifications);
router.get("/me", authMiddleware, getMyNotifications);
router.get("/unread-count", authMiddleware, getUnreadNotificationCount);
router.get("/:userId", authMiddleware, getNotifications);

module.exports = router;