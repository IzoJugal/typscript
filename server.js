const dotenv = require("dotenv");
const env = dotenv.config({ path: "./config.env" });
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/Database");

const authRoute = require("./route/AuthRoute");
const adminRoute = require("./route/AdminRoute");
const gaudaanRoute = require("./route/GaudaanRoute");
const contactRoute = require("./route/ContactRouter");

const app = express();

// 🌍 CORS Configuration
const corsOptions = {
  origin: ["http://localhost:5173", "https://api.gauabhayaranyam.com"],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🗂️ Serve static uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 🌐 Connect to MongoDB and start server
const PORT = 5000;

connectDB()
  .then(() => {
    console.log("🌐 MongoDB Connected Successfully.");

    // 🔁 Define Routes
    app.use("/auth", authRoute);
    app.use("/admin", adminRoute);
    app.use("/donation", gaudaanRoute);
    app.use("/contact", contactRoute);

    // 🧪 Root Health Check
    app.get("/", (req, res) => {
      console.log("🚀 API Gauabhayaranyam Run Success.");
      res.status(200).json({ success: true, message: "API Gauabhayaranyam Run." });
    });

    // 🛡️ Start Server
    app.listen(PORT, () => {
      console.log(`✅ Server running on port: ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("❌ MongoDB Connection Failed:", error.message);
    process.exit(1);
  });
