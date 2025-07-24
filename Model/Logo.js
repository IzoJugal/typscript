import mongoose from "mongoose"

const logoSchema = new mongoose.Schema({
  url: String,
  title: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Logo", logoSchema);
