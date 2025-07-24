import dotenv from "dotenv"
const env = dotenv.config({ path: "./config.env" });
import express from "express"
import cors from "cors"
import path from "path"
import connectDB from "./config/Database.js"

import authRoute from "./route/AuthRoute.js"
import adminRoute from "./route/AdminRoute.js"
import gaudaanRoute from "./route/GaudaanRoute.js"
import contactRoute from "./route/ContactRouter.js"
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


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
const PORT = 6000;

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
