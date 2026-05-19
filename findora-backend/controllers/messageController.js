const Message = require("../models/Message");

// SEND MESSAGE
exports.sendMessage = async (req, res) => {
  try {
    const { sender, receiver, text } = req.body;
    if (!sender || !receiver || !text || !String(text).trim()) {
      return res.status(400).json({ error: "sender, receiver and text are required" });
    }

    const msg = await Message.create({
      sender,
      receiver,
      text: String(text).trim(),
    });

    res.json(msg);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET CONVERSATION
exports.getMessages = async (req, res) => {
  try {
    const { user1, user2 } = req.params;
    if (!user1 || !user2) {
      return res.status(400).json({ error: "Both user IDs are required" });
    }

    const messages = await Message.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 },
      ],
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};