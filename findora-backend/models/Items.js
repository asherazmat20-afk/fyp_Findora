const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    category: String,
    location: String,
    date: String,
    time: String,
    type: String,
    image: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },

    // AI moderation/risk signals
    aiSignals: {
      textRichness: { type: Number, default: 0 },
      hasImage: { type: Boolean, default: false },
      duplicateTitleCount: { type: Number, default: 0 },
      locationSpecificity: { type: Number, default: 0 },
      riskScore: { type: Number, default: 0 },
      riskLevel: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "low",
      },
      reasons: [{ type: String }],
    },
    aiTags: {
      keywords: [{ type: String }],
      colors: [{ type: String }],
      brands: [{ type: String }],
      locationTokens: [{ type: String }],
      semanticText: { type: String, default: "" },
      embeddingVersion: { type: String, default: "heuristic-v1" },
      embeddingText: { type: String, default: "" },
      imageHash: { type: String, default: "" },
      detectedObjects: [{ type: String }],
      imageVector: [{ type: Number }],
    },

    // Claim + owner verification workflow
    claim: {
      status: {
        type: String,
        enum: ["none", "requested", "approved", "rejected", "returned"],
        default: "none",
      },
      requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      requestedAt: { type: Date, default: null },
      proofDescription: { type: String, default: "" },
      identifyingDetails: { type: String, default: "" },
      proofImage: { type: String, default: "" },
      reporterDecision: {
        type: String,
        enum: ["none", "confirmed", "rejected"],
        default: "none",
      },
      reporterDecidedAt: { type: Date, default: null },
      reporterNote: { type: String, default: "" },
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      resolvedAt: { type: Date, default: null },
      resolutionNote: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("item", itemSchema);