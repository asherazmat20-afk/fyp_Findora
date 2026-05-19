const express = require("express");
const router = express.Router();

const Item = require("../models/Items");
const {
  createItem,
  getItems,
  updateStatus,
  getAllItemsAdmin,
  getPossibleMatches,
  parseReportWithAI,
  enrichReportWithAI,
  requestClaim,
  resolveClaim,
  reporterReviewClaim,
  getItemById,
  getMyReports,
} = require("../controllers/itemController");

const authMiddleware = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/requireAdmin");

router.post("/ai/parse-report", authMiddleware, parseReportWithAI);
router.post("/ai/enrich", authMiddleware, enrichReportWithAI);

router.post("/match", authMiddleware, getPossibleMatches);

router.get("/admin", authMiddleware, requireAdmin, getAllItemsAdmin);

router.get("/mine", authMiddleware, getMyReports);

router.post("/create", authMiddleware, createItem);

router.get("/", getItems);

router.get("/:id", getItemById);

router.put("/status/:id", authMiddleware, requireAdmin, updateStatus);

// owner verification / claim workflow
router.post("/:id/claim-request", authMiddleware, requestClaim);
router.put("/:id/claim-reporter-review", authMiddleware, reporterReviewClaim);
router.put("/:id/claim-resolve", authMiddleware, requireAdmin, resolveClaim);

router.delete("/:id", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const deletedItem = await Item.findByIdAndDelete(req.params.id);
    if (!deletedItem) return res.status(404).json({ error: "Item not found" });
    res.json({ message: "Item deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;