const Item = require("../models/Items");
const cloudinary = require("../config/cloudinary");
const { Jimp, intToRGBA } = require("jimp");
const { createSystemNotification } = require("./notificationController");

const normalize = (text = "") =>
  text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

const tokens = (text = "") =>
  normalize(text)
    .split(" ")
    .filter((w) => w.length > 2);

const cosineSimilarity = (aText = "", bText = "") => {
  const a = tokens(aText);
  const b = tokens(bText);
  if (!a.length || !b.length) return 0;

  const tfA = {};
  const tfB = {};

  a.forEach((w) => (tfA[w] = (tfA[w] || 0) + 1));
  b.forEach((w) => (tfB[w] = (tfB[w] || 0) + 1));

  const all = new Set([...Object.keys(tfA), ...Object.keys(tfB)]);
  let dot = 0;
  let magA = 0;
  let magB = 0;

  all.forEach((w) => {
    const x = tfA[w] || 0;
    const y = tfB[w] || 0;
    dot += x * y;
    magA += x * x;
    magB += y * y;
  });

  if (!magA || !magB) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
};

const dateScore = (d1, d2) => {
  if (!d1 || !d2) return 0;
  const diff = Math.abs((new Date(d1) - new Date(d2)) / (1000 * 60 * 60 * 24));
  if (diff <= 1) return 20;
  if (diff <= 3) return 12;
  if (diff <= 7) return 6;
  return 0;
};

const locationSimilarity = (l1 = "", l2 = "") => {
  const a = new Set(tokens(l1));
  const b = new Set(tokens(l2));
  if (!a.size || !b.size) return 0;
  let common = 0;
  for (const w of a) if (b.has(w)) common++;
  return common / Math.max(a.size, b.size);
};

const getRiskSignals = async ({ title, description, location, image }) => {
  const text = `${title || ""} ${description || ""}`.trim();
  const textRichness = Math.min(tokens(text).length * 5, 100);
  const hasImage = Boolean(image);
  const locationSpecificity = Math.min(tokens(location || "").length * 20, 100);

  const duplicateTitleCount = await Item.countDocuments({
    title: { $regex: `^${(title || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
    createdAt: { $gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30) },
  });

  let riskScore = 0;
  const reasons = [];

  if (!hasImage) {
    riskScore += 25;
    reasons.push("No image uploaded");
  }

  if (textRichness < 35) {
    riskScore += 30;
    reasons.push("Description is too generic");
  }

  if (duplicateTitleCount >= 2) {
    riskScore += 25;
    reasons.push("Similar title reported multiple times recently");
  }

  if (locationSpecificity < 40) {
    riskScore += 20;
    reasons.push("Location detail is vague");
  }

  if (riskScore > 100) riskScore = 100;
  const riskLevel = riskScore >= 70 ? "high" : riskScore >= 40 ? "medium" : "low";

  return {
    textRichness,
    hasImage,
    duplicateTitleCount,
    locationSpecificity,
    riskScore,
    riskLevel,
    reasons,
  };
};

const base64ToBuffer = (base64Data = "") => {
  const cleaned = base64Data.replace(/^data:image\/\w+;base64,/, "");
  return Buffer.from(cleaned, "base64");
};

const computeImageHash = async (imageBase64 = "") => {
  if (!imageBase64) return "";
  const buffer = base64ToBuffer(imageBase64);
  const image = await Jimp.read(buffer);
  image.resize({ w: 8, h: 8 });
  image.greyscale();

  const values = [];
  let sum = 0;
  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      const { r } = intToRGBA(image.getPixelColor(x, y));
      values.push(r);
      sum += r;
    }
  }

  const average = sum / values.length;
  return values.map((value) => (value >= average ? "1" : "0")).join("");
};

const hammingDistance = (a = "", b = "") => {
  const length = Math.min(a.length, b.length);
  let diff = Math.abs(a.length - b.length);
  for (let i = 0; i < length; i += 1) {
    if (a[i] !== b[i]) diff += 1;
  }
  return diff;
};

const imageSimilarity = (hashA = "", hashB = "") => {
  if (!hashA || !hashB) return 0;
  const distance = hammingDistance(hashA, hashB);
  return Math.round(Math.max(0, 100 - (distance * 100) / 64));
};

const detectImageObjects = async (imageBase64 = "") => {
  const url = process.env.YOLO_API_URL;
  if (!url || !imageBase64) return [];

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.YOLO_API_KEY ? { Authorization: `Bearer ${process.env.YOLO_API_KEY}` } : {}),
      },
      body: JSON.stringify({ image: imageBase64 }),
    });

    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data.objects) ? data.objects.slice(0, 6) : [];
  } catch (error) {
    return [];
  }
};

const extractAiFeatures = ({ title = "", description = "", location = "", category = "", imageHash = "", detectedObjects = [] }) => {
  const combined = `${title} ${description}`;
  const rawTokens = tokens(combined);
  const uniqueKeywords = [...new Set(rawTokens)].slice(0, 12);

  const colors = [
    "black",
    "white",
    "blue",
    "red",
    "green",
    "gray",
    "grey",
    "brown",
    "pink",
    "silver",
    "gold",
  ];
  const brands = [
    "apple",
    "samsung",
    "xiaomi",
    "oppo",
    "vivo",
    "hp",
    "dell",
    "lenovo",
    "nike",
    "adidas",
  ];

  const normalized = normalize(combined);
  const detectedColors = colors.filter((c) => normalized.includes(c));
  const detectedBrands = brands.filter((b) => normalized.includes(b));

  return {
    keywords: uniqueKeywords,
    colors: detectedColors,
    brands: detectedBrands,
    locationTokens: [...new Set(tokens(location))].slice(0, 6),
    semanticText: normalize(combined),
    // placeholder fields for future embedding services
    embeddingVersion: "heuristic-v1",
    embeddingText: normalize(`${category} ${combined} ${location}`),
    imageHash,
    detectedObjects,
    imageVector: [],
  };
};

const scoreMatch = (input, item) => {
  let score = 15; // opposite type baseline
  const reasons = [];

  const sameCategory =
    String(input.category || "").toLowerCase() === String(item.category || "").toLowerCase();
  if (sameCategory) {
    score += 20;
    reasons.push("Same item category");
  }

  const semantic = cosineSimilarity(
    `${input.title || ""} ${input.description || ""}`,
    `${item.title || ""} ${item.description || ""}`
  );
  const semanticPoints = Math.round(semantic * 35);
  score += semanticPoints;
  if (semanticPoints >= 18) reasons.push("Descriptions are semantically similar");

  const locSim = locationSimilarity(input.location || "", item.location || "");
  const locPoints = Math.round(locSim * 20);
  score += locPoints;
  if (locPoints >= 10) reasons.push("Location details overlap strongly");

  const dPoints = dateScore(input.date, item.date);
  score += dPoints;
  if (dPoints >= 12) reasons.push("Date proximity is strong");

  const imageHashA = input.aiTags?.imageHash || "";
  const imageHashB = item.aiTags?.imageHash || "";
  const imageMatchScore = imageSimilarity(imageHashA, imageHashB);
  if (imageMatchScore >= 70) {
    score += 20;
    reasons.push("Images are visually very similar");
  } else if (imageMatchScore >= 50) {
    score += 10;
    reasons.push("Images share strong visual similarity");
  } else if (input.image && item.image) {
    score += 8;
    reasons.push("Both reports include images");
  }

  const objectsA = new Set(input.aiTags?.detectedObjects || []);
  const objectsB = new Set(item.aiTags?.detectedObjects || []);
  const commonObjects = [...objectsA].filter((object) => objectsB.has(object));
  if (commonObjects.length > 0) {
    score += Math.min(18, 8 + commonObjects.length * 4);
    reasons.push(`Detected objects overlap: ${commonObjects.slice(0, 3).join(", ")}`);
  }

  if (score > 100) score = 100;
  const confidence = score >= 80 ? "high" : score >= 60 ? "medium" : "low";

  return { score, confidence, reasons };
};

const createMatchAlerts = async (sourceItem, matches) => {
  const top = matches.slice(0, 3).filter((m) => m.matchScore >= 70);

  for (const m of top) {
    // Alert source reporter
    await createSystemNotification({
      receiver: sourceItem.user,
      type: "match_alert",
      itemId: sourceItem._id,
      message: `High-confidence match (${m.matchScore}%) found for "${sourceItem.title}".`,
    });

    // Alert matched item owner
    if (m.item.user?._id && String(m.item.user._id) !== String(sourceItem.user)) {
      await createSystemNotification({
        receiver: m.item.user._id,
        type: "match_alert",
        itemId: m.item._id,
        message: `Your item "${m.item.title}" may match a newly reported item.`,
      });
    }
  }
};

const createFoundItemReportAlerts = async (foundItem) => {
  if (!foundItem || foundItem.type !== "found") return;

  const lostCandidates = await Item.find({
    status: "verified",
    type: "lost",
    category: foundItem.category,
    user: { $ne: foundItem.user },
  })
    .populate("user", "fullName email phone")
    .sort({ createdAt: -1 })
    .limit(100);

  const matches = lostCandidates
    .map((item) => {
      const { score } = scoreMatch(foundItem, item);
      return { item, matchScore: score };
    })
    .filter((m) => m.matchScore >= 55)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 8);

  for (const match of matches) {
    if (!match.item.user?._id) continue;

    await createSystemNotification({
      receiver: match.item.user._id,
      type: "found_item_alert",
      itemId: foundItem._id,
      message: `A newly reported found item "${foundItem.title}" may match your lost item "${match.item.title}".`,
    });
  }
};

const getScoredMatchesForItem = async (input) => {
  if (!input?.type || !input?.category || !input?.location) {
    return [];
  }

  const oppositeType = input.type === "lost" ? "found" : "lost";

  const candidates = await Item.find({
    status: "verified",
    type: oppositeType,
    _id: { $exists: true },
  })
    .populate("user", "fullName email phone")
    .sort({ createdAt: -1 })
    .limit(120);

  return candidates
    .map((item) => {
      const { score, confidence, reasons } = scoreMatch(input, item);

      return {
        item,
        matchScore: score,
        confidence,
        reasons,
      };
    })
    .filter((m) => m.matchScore >= 35)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 8);
};

// CREATE ITEM
exports.createItem = async (req, res) => {
  try {
    const { title, description, category, location, date, time, type, image, aiTags } = req.body;

    let imageUrl = "";
    const imageHash = image ? await computeImageHash(image) : "";
    const detectedObjects = image ? await detectImageObjects(image) : [];

    if (image) {
      try {
        const upload = await cloudinary.uploader.upload(image, { folder: "findora" });
        imageUrl = upload.secure_url;
      } catch (err) {
        return res.status(400).json({ error: "Image upload failed" });
      }
    }

    const aiSignals = await getRiskSignals({
      title,
      description,
      location,
      image: imageUrl,
    });
    const computedAiTags = extractAiFeatures({
      title,
      description,
      location,
      category,
      imageHash,
      detectedObjects,
    });

    const mergedAiTags = aiTags && typeof aiTags === "object" ? { ...computedAiTags, ...aiTags } : computedAiTags;

    const newItem = await Item.create({
      title,
      description,
      category,
      location,
      date,
      time,
      type,
      image: imageUrl,
      user: req.user.id,
      aiSignals,
      aiTags: mergedAiTags,
    });

    const matches = await getScoredMatchesForItem({
      title,
      description,
      category,
      location,
      date,
      type,
      image: imageUrl,
      aiTags: mergedAiTags,
    });

    await createMatchAlerts(newItem, matches);
    await createFoundItemReportAlerts(newItem);

    res.json({
      message: "Item reported successfully",
      newItem,
      aiSignals,
      matches,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getItems = async (req, res) => {
  try {
    const items = await Item.find({ status: "verified" }).populate("user", "email fullName phone");
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ["pending", "verified", "rejected"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const item = await Item.findByIdAndUpdate(id, { status }, { new: true });
    if (!item) return res.status(404).json({ error: "Item not found" });

    return res.json(item);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getAllItemsAdmin = async (req, res) => {
  try {
    const items = await Item.find()
      .populate("user", "email fullName phone")
      .populate("claim.requestedBy", "fullName email phone");
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate("user", "fullName email phone")
      .populate("claim.requestedBy", "fullName email phone");

    if (!item) return res.status(404).json({ error: "Item not found" });
    if (item.status !== "verified") {
      return res.status(404).json({ error: "Item not found" });
    }

    return res.json(item);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getMyReports = async (req, res) => {
  try {
    const items = await Item.find({ user: req.user.id })
      .populate("user", "fullName email phone")
      .populate("claim.requestedBy", "fullName email phone")
      .sort({ updatedAt: -1 });
    return res.json(items);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const uploadProofImage = async (proofImage) => {
  if (!proofImage || typeof proofImage !== "string") return "";
  try {
    const upload = await cloudinary.uploader.upload(proofImage, { folder: "findora/claims" });
    return upload.secure_url;
  } catch {
    return "";
  }
};

// AI-style semantic matching + explainability + proactive alerts
exports.getPossibleMatches = async (req, res) => {
  try {
    const { type, category, location, date, title, description, image } = req.body;

    if (!type || !category || !location) {
      return res.status(400).json({ error: "type, category and location are required" });
    }

    const inputAiTags = image
      ? {
          imageHash: await computeImageHash(image),
          detectedObjects: await detectImageObjects(image),
        }
      : {};

    const scored = await getScoredMatchesForItem({
      title,
      description,
      location,
      date,
      image,
      category,
      type,
      aiTags: inputAiTags,
    });

    // Optional proactive alerts for top matches against caller's latest item
    const myLatest = await Item.findOne({ user: req.user.id }).sort({ createdAt: -1 });
    if (myLatest) {
      await createMatchAlerts(myLatest, scored);
    }

    return res.json({ matches: scored });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// AI auto-fill endpoint
exports.parseReportWithAI = async (req, res) => {
  try {
    const { text, type } = req.body;
    if (!text || text.trim().length < 8) {
      return res.status(400).json({ error: "Please provide enough detail" });
    }

    const t = normalize(text);

    const capitalize = (s = "") => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

    const extractLocation = (raw = "") => {
      const m = raw.match(/\b(?:at|near|in)\s+([^.,\n]{3,80})/i);
      if (!m) return "";
      let loc = (m[1] || "").trim();

      // Stop at common time/date phrases that follow a location in sentences
      loc = loc
        .split(/\b(?:yesterday|today|tomorrow|last|this|around|approx|approximately|evening|morning|night|afternoon|am|pm|on)\b/i)[0]
        .trim();

      // Trim dangling separators
      loc = loc.replace(/[-,]+$/g, "").trim();
      return loc;
    };

    const extractTitle = (category, normText) => {
      const colors = [
        "black",
        "white",
        "blue",
        "red",
        "green",
        "gray",
        "grey",
        "brown",
        "pink",
        "silver",
        "gold",
      ];
      const color = colors.find((c) => normText.includes(c)) || "";

      // Use a short, human-friendly title (no forced "Lost/Found" prefix)
      if (color && category && category !== "Other") return `${capitalize(color)} ${category}`;
      if (category && category !== "Other") return `${category}`;

      // fallback: first 3-5 meaningful words
      const words = tokens(normText).slice(0, 5);
      return words.length ? words.map(capitalize).join(" ") : "Item";
    };

    const categoryMap = [
      { key: "wallet", cat: "Wallet" },
      { key: "phone", cat: "Mobile" },
      { key: "mobile", cat: "Mobile" },
      { key: "id card", cat: "Documents" },
      { key: "card", cat: "Documents" },
      { key: "laptop", cat: "Electronics" },
      { key: "earbuds", cat: "Electronics" },
      { key: "keys", cat: "Other" },
    ];

    const category = categoryMap.find((x) => t.includes(x.key))?.cat || "Other";
    const location = extractLocation(text);
    const title = extractTitle(category, t);

    const parsed = {
      title,
      itemName: title, // for ReportLost compatibility
      category,
      description: text.trim(),
      location,
      date: new Date().toISOString().slice(0, 10),
      confidence: location ? "high" : "medium",
      hints: [
        "Please verify date/time before submit",
        "Add image for better matching confidence",
      ],
    };

    return res.json({ parsed });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Step-2 AI enrichment endpoint: extract tags/features for matching
exports.enrichReportWithAI = async (req, res) => {
  try {
    const { title = "", description = "", location = "", category = "" } = req.body;
    const contentSize = `${title} ${description} ${location}`.trim().length;
    if (contentSize < 8) {
      return res.status(400).json({ error: "Provide more detail for AI enrichment" });
    }

    const aiTags = extractAiFeatures({ title, description, location, category });
    return res.json({ aiTags });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Owner verification: claimant submits proof
exports.requestClaim = async (req, res) => {
  try {
    const { proofDescription, identifyingDetails, proofImage } = req.body;

    const item = await Item.findById(req.params.id).populate("user", "fullName email phone");
    if (!item) return res.status(404).json({ error: "Item not found" });

    if (item.status !== "verified") {
      return res.status(400).json({ error: "Item must be verified before ownership claims" });
    }

    if (String(item.user._id) === String(req.user.id)) {
      return res.status(400).json({ error: "You cannot claim your own item" });
    }

    if (item.claim?.status === "requested") {
      return res.status(400).json({ error: "Ownership verification already pending" });
    }

    if (item.claim?.status === "approved") {
      return res.status(400).json({ error: "Ownership already verified for this item" });
    }

    const proof = String(proofDescription || "").trim();
    if (proof.length < 15) {
      return res.status(400).json({
        error: "Describe how you can prove ownership (at least 15 characters)",
      });
    }

    const proofImageUrl = await uploadProofImage(proofImage);

    item.claim = {
      status: "requested",
      requestedBy: req.user.id,
      requestedAt: new Date(),
      proofDescription: proof,
      identifyingDetails: String(identifyingDetails || "").trim(),
      proofImage: proofImageUrl,
      reporterDecision: "none",
      reporterDecidedAt: null,
      reporterNote: "",
      resolvedBy: null,
      resolvedAt: null,
      resolutionNote: "",
    };

    await item.save();

    await createSystemNotification({
      sender: req.user.id,
      receiver: item.user._id,
      type: "claim_request",
      itemId: item._id,
      message: `Someone submitted owner verification for "${item.title}". Review their proof on your dashboard.`,
    });

    return res.json({ message: "Ownership verification submitted", item });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Reporter (listing owner) confirms or rejects ownership proof
exports.reporterReviewClaim = async (req, res) => {
  try {
    const { action, note } = req.body;

    if (!["confirm", "reject"].includes(action)) {
      return res.status(400).json({ error: "Action must be confirm or reject" });
    }

    const item = await Item.findById(req.params.id).populate("claim.requestedBy", "fullName email phone");
    if (!item) return res.status(404).json({ error: "Item not found" });

    if (String(item.user._id || item.user) !== String(req.user.id)) {
      return res.status(403).json({ error: "Only the listing owner can verify ownership proof" });
    }

    if (item.claim?.status !== "requested") {
      return res.status(400).json({ error: "No pending ownership verification" });
    }

    item.claim.reporterDecision = action === "confirm" ? "confirmed" : "rejected";
    item.claim.reporterDecidedAt = new Date();
    item.claim.reporterNote = String(note || "").trim();
    await item.save();

    if (item.claim.requestedBy?._id) {
      await createSystemNotification({
        sender: req.user.id,
        receiver: item.claim.requestedBy._id,
        type: "claim_update",
        itemId: item._id,
        message:
          action === "confirm"
            ? `The reporter confirmed your ownership proof for "${item.title}". Admin will finalize.`
            : `The reporter rejected your ownership proof for "${item.title}".`,
      });
    }

    return res.json({
      message: action === "confirm" ? "Ownership proof confirmed" : "Ownership proof rejected",
      item,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Claim resolution by admin
exports.resolveClaim = async (req, res) => {
  try {
    const { action, note } = req.body; // approve | reject | returned
    if (!["approve", "reject", "returned"].includes(action)) {
      return res.status(400).json({ error: "Invalid action" });
    }

    const item = await Item.findById(req.params.id)
      .populate("claim.requestedBy", "fullName email phone")
      .populate("user", "fullName email phone");
    if (!item) return res.status(404).json({ error: "Item not found" });

    if (!item.claim?.requestedBy) {
      return res.status(400).json({ error: "No claim to resolve" });
    }

    const map = {
      approve: "approved",
      reject: "rejected",
      returned: "returned",
    };

    item.claim.status = map[action];
    item.claim.resolvedBy = req.user.id;
    item.claim.resolvedAt = new Date();
    item.claim.resolutionNote = note || "";

    await item.save();

    await createSystemNotification({
      receiver: item.claim.requestedBy,
      type: "claim_update",
      itemId: item._id,
      message: `Owner verification for "${item.title}" is ${item.claim.status}.`,
    });

    await createSystemNotification({
      receiver: item.user,
      type: "claim_update",
      itemId: item._id,
      message: `Owner verification for "${item.title}" is now ${item.claim.status}.`,
    });

    return res.json({ message: "Owner verification resolved", item });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
