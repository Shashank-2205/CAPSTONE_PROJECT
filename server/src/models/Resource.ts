import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IResource extends Document {
  resourceId: string;
  ngo: Types.ObjectId;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  location: string;
  status: 'Healthy' | 'Low stock' | 'Critical';
  coordinates?: { type: 'Point'; coordinates: [number, number] };
  createdAt: Date;
  updatedAt: Date;
}

const ResourceSchema = new Schema<IResource>(
  {
    resourceId: { type: String, required: true, unique: true },
    ngo: { type: Schema.Types.ObjectId, ref: 'NGO', required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true },
    location: { type: String, required: true },
    status: { type: String, enum: ['Healthy', 'Low stock', 'Critical'], default: 'Healthy' },
    coordinates: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number], default: [0, 0] },
    },
  },
  { timestamps: true },
);

// resourceId index created automatically via unique: true
ResourceSchema.index({ ngo: 1 });
ResourceSchema.index({ category: 1 });
ResourceSchema.index({ 'coordinates.coordinates': '2dsphere' });

export const Resource = mongoose.model<IResource>('Resource', ResourceSchema);
