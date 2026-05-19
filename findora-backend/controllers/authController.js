const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// SIGNUP
exports.signup = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;

    if (!fullName || !email || !password || !phone?.trim()) {
      return res.status(400).json({ error: "Name, email, phone, and password are required" });
    }
    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) {
      return res.status(409).json({ error: "Email already exists" });
    }

    const hashedPass = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      fullName,
      email,
      phone: phone.trim(),
      password: hashedPass,
      role: "user",
    });

    const safeUser = {
      _id: newUser._id,
      fullName: newUser.fullName,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
    };

    return res.status(201).json({ message: "Signup successful", user: safeUser });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const safeUser = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || "",
      role: user.role,
    };

    return res.json({ message: "Login successful", token, user: safeUser });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { phone, fullName } = req.body;
    const updates = {};

    if (fullName !== undefined) {
      const trimmed = String(fullName).trim();
      if (!trimmed) return res.status(400).json({ error: "Full name cannot be empty" });
      updates.fullName = trimmed;
    }

    if (phone !== undefined) {
      const trimmed = String(phone).trim();
      if (!trimmed) return res.status(400).json({ error: "Phone number is required" });
      updates.phone = trimmed;
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: "No updates provided" });
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) return res.status(404).json({ error: "User not found" });

    return res.json({
      message: "Profile updated",
      user,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};