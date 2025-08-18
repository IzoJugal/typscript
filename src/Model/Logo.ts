import mongoose, { Document, Schema, model, Types } from "mongoose";

export interface ILogo extends Document {
  title: string;
  filename: string;
  fileId: Types.ObjectId;
  uploadedBy: Types.ObjectId;
  createdAt: Date;
}

const logoSchema = new Schema<ILogo>(
  {
    title: {
      type: String,
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
    fileId: {
      type: Schema.Types.ObjectId,
      required: true,
      unique: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false } // createdAt is manually set here
);
const Logo =  model<ILogo>("Logo", logoSchema);

export default Logo;
