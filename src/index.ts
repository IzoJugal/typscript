import express from "express";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes"
dotenv.config();

const app = express();
const PORT = process.env.PORT || 7000;

app.use(express.json());
app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to the API 6000 ts");
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
