const User = require("../models/User");
const Item = require("../models/Items");
const Notification = require("../models/Notification");
const Message = require("../models/Message");

exports.getAllUsersAdmin = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 }).lean();

    const reportCounts = await Item.aggregate([
      { $match: { user: { $ne: null } } },
      { $group: { _id: "$user", count: { $sum: 1 } } },
    ]);

    const countByUser = reportCounts.reduce((acc, row) => {
      acc[row._id.toString()] = row.count;
      return acc;
    }, {});

    const payload = users.map((user) => ({
      ...user,
      reportCount: countByUser[user._id.toString()] || 0,
    }));

    return res.json(payload);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.deleteUserAdmin = async (req, res) => {
  try {
    const targetId = req.params.id;

    if (String(targetId) === String(req.user.id)) {
      return res.status(400).json({ error: "You cannot delete your own admin account" });
    }

    const target = await User.findById(targetId);
    if (!target) {
      return res.status(404).json({ error: "User not found" });
    }

    if (target.role === "admin") {
      return res.status(403).json({ error: "Admin accounts cannot be deleted" });
    }

    await Promise.all([
      Item.deleteMany({ user: targetId }),
      Notification.deleteMany({
        $or: [{ sender: targetId }, { receiver: targetId }],
      }),
      Message.deleteMany({
        $or: [{ sender: targetId }, { receiver: targetId }],
      }),
    ]);

    await User.findByIdAndDelete(targetId);

    return res.json({ message: "User and related data removed successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
