import mongoose from "mongoose";

const connectDB = async () => {
  // const uri = process.env.MONGO_URI;
  const uri = "mongodb+srv://nileshahir286:55F0jUoOC2Cj7c5D@gauabhayaranyam.bwkbrlp.mongodb.net/gauabhayaranyam?retryWrites=true&w=majority;"

console.log(`MOGO_URI:`,uri);

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

export default connectDB;
