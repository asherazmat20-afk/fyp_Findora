const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error("MONGO_URI is not set. Add it in Railway environment variables.");
    return;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("Database Error:", error.message);
    console.error(
      "Check MONGO_URI on Railway and MongoDB Atlas Network Access (allow 0.0.0.0/0)."
    );
  }
};

module.exports = connectDB;
