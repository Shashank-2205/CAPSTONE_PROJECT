import mongoose, { Document, Schema } from 'mongoose';

export interface IDisaster extends Document {
  disasterId: string;
  name: string;
  region: string;
  severity: 'Low' | 'Moderate' | 'High' | 'Critical';
  status: 'Active' | 'Contained' | 'Resolved' | 'Archived';
  affectedAreas: number;
  coordinates?: { type: 'Point'; coordinates: [number, number] };
  startedAt?: Date;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DisasterSchema = new Schema<IDisaster>(
  {
    disasterId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    region: { type: String, required: true },
    severity: { type: String, enum: ['Low', 'Moderate', 'High', 'Critical'], required: true },
    status: { type: String, enum: ['Active', 'Contained', 'Resolved', 'Archived'], default: 'Active' },
    affectedAreas: { type: Number, required: true, min: 0 },
    coordinates: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number], default: [0, 0] },
    },
    startedAt: { type: Date },
    endedAt: { type: Date },
  },
  { timestamps: true },
);

// disasterId index created automatically via unique: true
DisasterSchema.index({ status: 1 });
DisasterSchema.index({ 'coordinates.coordinates': '2dsphere' });

export const Disaster = mongoose.model<IDisaster>('Disaster', DisasterSchema);
