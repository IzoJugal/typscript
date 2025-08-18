import mongoose from "mongoose";

function getGFS(): mongoose.mongo.GridFSBucket {
  const conn: mongoose.Connection = mongoose.connection;
  if (!conn || !conn.db) {
    throw new Error("MongoDB connection not ready");
  }
  return new mongoose.mongo.GridFSBucket(conn.db, { bucketName: "logos" });
}

export default getGFS;