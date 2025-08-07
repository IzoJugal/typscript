const mongoose = require("mongoose");

function getGFS() {
  const conn = mongoose.connection;
  if (!conn || !conn.db) {
    throw new Error("MongoDB connection not ready");
  }
  return new mongoose.mongo.GridFSBucket(conn.db, { bucketName: "logos" });
}

module.exports = getGFS;
