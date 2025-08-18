import dotenv from "dotenv";
import express, { Request, Response } from "express";
import cors, { CorsOptions } from "cors";
import path from "path";
import connectDB from "./config/Database";
import authRoute from "./route/AuthRoute";
import adminRoute from "./route/AdminRoute";
import contactRoute from "./route/ContactRouter";
import notificationRoute from "./route/NotificationRoute";
import logoUploadRoute from "./route/LogoUpload";
import http, { Server } from "http";
import { init } from "./config/socket";

dotenv.config({ path: "./.env" }); // Simplified dotenv configuration

const app: express.Application = express();
const corsOptions: CorsOptions = {
  origin: "*", // You can tighten this later for security purposes
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
};

const PORT: number = 5000;

// Initialize the HTTP server
const server: Server = http.createServer(app);

// Initialize the socket connection
init(server);

// Middleware setup
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Database connection and route setup
connectDB()
  .then(() => {
    // Register routes only after DB is connected
    app.use("/auth", authRoute);
    app.use("/admin", adminRoute);
    app.use("/contact", contactRoute);
    app.use("/notifications", notificationRoute);
    app.use("/logo", logoUploadRoute);

    // Simple root endpoint for API status
    app.get("/", (req: Request, res: Response): Response => {
      return res.status(200).json({ success: true, message: "API Gauabhayaranyam Run." });
    });

    // Start the server
    server.listen(PORT, () => {
      console.log(`✅ Server is running on port ${PORT}`);
    });
  })
  .catch((error: Error) => {
    console.error("❌ MongoDB Connection Failed:", error.message);
    process.exit(1);
  });
