import { Schema, model, Document } from "mongoose";

// TypeScript interface for a single image
interface IImageItem {
  url: string;
  public_id: string;
  title?: string;
  description?: string;
}

// TypeScript interface for the Image document
export interface ISlider extends Document {
  images: IImageItem[];
  createdAt: Date;
}

// Define the schema
const sliderSchema = new Schema<ISlider>({
  images: [
    {
      url: { type: String, required: true },
      public_id: { type: String, required: true },
      title: { type: String },
      description: { type: String },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Export the model
const Slider = model<ISlider>("Image", sliderSchema);

export default Slider ;
