import { Schema, model, Document } from "mongoose";

// Define a TypeScript interface for the Shelter document
export interface IShelter extends Document {
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  profileImage?: string;
  address: string;
  capacity?: number;
  isActive: boolean;
  currentOccupancy: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Create the schema
const shelterSchema = new Schema<IShelter>(
  {
    name: { type: String, required: true },
    contactPerson: { type: String },
    phone: { type: String, required: true },
    email: { type: String },
    profileImage: { type: String, default: "" },
    address: { type: String, required: true },
    capacity: { type: Number },
    isActive: { type: Boolean, default: true },
    currentOccupancy: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Export the model
const Shelter = model<IShelter>("Shelter", shelterSchema);

export default Shelter ;
