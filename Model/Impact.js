import mongoose from "mongoose"

const impactSchema = new mongoose.Schema({      
  count: String,       
  label: String,       
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Impact", impactSchema);

