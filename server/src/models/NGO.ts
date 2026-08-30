import mongoose, { Document, Schema, Types } from 'mongoose';

export interface INGO extends Document {
  user: Types.ObjectId;
  organizationName: string;
  registrationNumber: string;
  description?: string;
  contact?: string;
  address?: string;
  coordinates?: { type: 'Point'; coordinates: [number, number] };
  verificationStatus: 'Unverified' | 'Verified' | 'Rejected';
  createdAt: Date;
  updatedAt: Date;
}

const NGOSchema = new Schema<INGO>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    organizationName: { type: String, required: true },
    registrationNumber: { type: String, required: true, unique: true },
    description: { type: String },
    contact: { type: String },
    address: { type: String },
    coordinates: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number], default: [0, 0] },
    },
    verificationStatus: { type: String, enum: ['Unverified', 'Verified', 'Rejected'], default: 'Unverified' },
  },
  { timestamps: true },
);

// user and registrationNumber indices created automatically via unique: true
NGOSchema.index({ 'coordinates.coordinates': '2dsphere' });

export const NGO = mongoose.model<INGO>('NGO', NGOSchema);
