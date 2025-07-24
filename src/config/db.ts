import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect("mongodb+srv://nileshahir286:55F0jUoOC2Cj7c5D@gauabhayaranyam.bwkbrlp.mongodb.net/typscript");
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

export default connectDB;
