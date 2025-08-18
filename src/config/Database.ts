import mongoose, { ConnectOptions } from "mongoose";

const connectDB = async (): Promise<void> => {
  const uri: string | undefined = process.env.MONGO_URI;

  if (!uri) {
    console.error("❌ MONGO_URI is not defined in .env");
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {} as ConnectOptions);
    console.log("✅ MongoDB Connected:", conn.connection.host);
    console.log("🌐 MongoDB Connected DB.", conn.connection.name);

  } catch (error: any) {
    console.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

export default connectDB;