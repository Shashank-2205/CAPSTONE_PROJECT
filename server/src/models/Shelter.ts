import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IShelter extends Document {
  shelterId: string;
  ngo: Types.ObjectId;
  name: string;
  capacity: number;
  occupants: number;
  facilities: string[];
  status: 'Open' | 'At capacity' | 'Closed';
  location: string;
  coordinates?: { type: 'Point'; coordinates: [number, number] };
  createdAt: Date;
  updatedAt: Date;
}

const ShelterSchema = new Schema<IShelter>(
  {
    shelterId: { type: String, required: true, unique: true },
    ngo: { type: Schema.Types.ObjectId, ref: 'NGO', required: true },
    name: { type: String, required: true },
    capacity: { type: Number, required: true, min: 0 },
    occupants: { type: Number, required: true, min: 0 },
    facilities: { type: [String], default: [] },
    status: { type: String, enum: ['Open', 'At capacity', 'Closed'], default: 'Open' },
    location: { type: String, required: true },
    coordinates: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number], default: [0, 0] },
    },
  },
  { timestamps: true },
);

// shelterId index created automatically via unique: true
ShelterSchema.index({ ngo: 1 });
ShelterSchema.index({ status: 1 });
ShelterSchema.index({ 'coordinates.coordinates': '2dsphere' });

export const Shelter = mongoose.model<IShelter>('Shelter', ShelterSchema);
