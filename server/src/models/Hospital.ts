import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IHospital extends Document {
  user: Types.ObjectId;
  name: string;
  registrationNumber: string;
  contact?: string;
  address?: string;
  coordinates?: { type: 'Point'; coordinates: [number, number] };
  bedCapacity: number;
  availableBeds: number;
  icuCapacity: number;
  availableICUBeds: number;
  emergencyCapacity: number;
  activeEmergencyCases: number;
  medicalResources?: string[];
  verificationStatus: 'Unverified' | 'Verified' | 'Rejected';
  createdAt: Date;
  updatedAt: Date;
}

const HospitalSchema = new Schema<IHospital>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    name: { type: String, required: true },
    registrationNumber: { type: String, required: true, unique: true },
    contact: { type: String },
    address: { type: String },
    coordinates: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number], default: [0, 0] },
    },
    bedCapacity: { type: Number, required: true, min: 0 },
    availableBeds: { type: Number, required: true, min: 0 },
    icuCapacity: { type: Number, required: true, min: 0 },
    availableICUBeds: { type: Number, required: true, min: 0 },
    emergencyCapacity: { type: Number, default: 0, min: 0 },
    activeEmergencyCases: { type: Number, default: 0, min: 0 },
    medicalResources: { type: [String], default: [] },
    verificationStatus: { type: String, enum: ['Unverified', 'Verified', 'Rejected'], default: 'Unverified' },
  },
  { timestamps: true },
);

// user and registrationNumber indices created automatically via unique: true
HospitalSchema.index({ 'coordinates.coordinates': '2dsphere' });

export const Hospital = mongoose.model<IHospital>('Hospital', HospitalSchema);
