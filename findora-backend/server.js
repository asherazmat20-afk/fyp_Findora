require("dotenv").config();

const { Server } = require("socket.io");
const http = require("http");
const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");
const connectDB = require("./config/db");

const app = express();
const server = http.createServer(app);

const defaultOrigins = [
  "http://localhost:3000",
  "https://fyp-findora.vercel.app",
];

const parseAllowedOrigins = () => {
  const fromEnv = process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL || "";
  const extra = fromEnv
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  return [...new Set([...defaultOrigins, ...extra])];
};

const allowedOrigins = parseAllowedOrigins();

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  // Vercel preview/production subdomains for this app
  if (/^https:\/\/[\w-]+(--[\w-]+)?\.vercel\.app$/.test(origin)) return true;
  return false;
};

const corsOptions = {
  origin(origin, callback) {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      console.warn("CORS blocked origin:", origin);
      callback(new Error(`CORS not allowed for origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) callback(null, true);
      else callback(new Error("CORS blocked"));
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("sendMessage", (data) => {
    socket.broadcast.emit("receiveMessage", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.get("/", (req, res) => {
  res.json({ ok: true, service: "findora-api" });
});

app.get("/health", (req, res) => {
  const dbReady = mongoose.connection.readyState === 1;
  res.status(dbReady ? 200 : 503).json({
    ok: dbReady,
    db: dbReady ? "connected" : "disconnected",
  });
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/items", require("./routes/itemRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));

const PORT = process.env.PORT || 5000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  console.log("Allowed CORS origins:", allowedOrigins.join(", "));
  connectDB();
});
