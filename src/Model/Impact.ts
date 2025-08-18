import mongoose, { Document, Schema, model } from "mongoose";

export interface IImpact extends Document {
  count?: string;
  label?: string;
  createdAt: Date;
}

const impactSchema = new Schema<IImpact>(
  {
    count: { type: String },
    label: { type: String },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false } // createdAt managed manually here
);

const Impact = model<IImpact>("Impact", impactSchema);

export default Impact;
