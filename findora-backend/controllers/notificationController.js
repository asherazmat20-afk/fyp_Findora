const Notification = require("../models/Notification");

// Reusable helper
const createSystemNotification = async ({
  sender = null,
  receiver,
  type = "system",
  message,
  itemId = null,
}) => {
  if (!receiver || !message) return null;
  return Notification.create({
    sender,
    receiver,
    type,
    message,
    itemId,
  });
};

exports.createSystemNotification = createSystemNotification;

// CREATE NOTIFICATION
exports.createNotification = async (req, res) => {
  try {
    const { receiverId, message, type, itemId } = req.body;

    const notif = await Notification.create({
      sender: req.user?.id || null,
      receiver: receiverId,
      message,
      type: type || "message",
      itemId: itemId || null,
    });

    res.json(notif);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET CURRENT USER NOTIFICATIONS
exports.getMyNotifications = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        receiver: req.user.id,
        read: false,
      },
      {
        $set: { read: true },
      }
    );

    const notifs = await Notification.find({
      receiver: req.user.id,
    }).sort({ createdAt: -1 });

    res.json(notifs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUnreadNotificationCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      receiver: req.user.id,
      read: false,
    });

    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.clearMyNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({
      receiver: req.user.id,
    });

    res.json({ message: "Notifications cleared" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Backward-compatible route if you still call /:userId
exports.getNotifications = async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.id !== req.params.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const notifs = await Notification.find({
      receiver: req.params.userId,
    }).sort({ createdAt: -1 });

    res.json(notifs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};