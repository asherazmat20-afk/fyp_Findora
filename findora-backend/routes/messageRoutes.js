const express = require("express");
const router = express.Router();

const {
  sendMessage,
  getMessages,
} = require("../controllers/messageController");

router.post("/send", sendMessage);
router.get("/:user1/:user2", getMessages);

module.exports = router;