import express from "express";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes"
import connectDB from "./config/db";
dotenv.config();

connectDB(); // Connect to MongoDB


const app = express();
const PORT = process.env.PORT || 7000;

app.use(express.json());
app.use("/api", userRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to the API 6000 ts");
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
