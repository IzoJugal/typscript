const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
console.log(`MOGO_URI__________:`,process.env.MONGO_URI);

  if (!uri) {
    console.error("❌ MONGO_URI is not defined in .env");
    process.exit(1);
  }

  try {
    console.log("🌐 Connecting to MongoDB...");
    const conn = await mongoose.connect(uri);
    console.log("✅ MongoDB Connected:", conn.connection.host);
    console.log("🌐 MongoDB Connected DB.",conn.connection.name);
  
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
