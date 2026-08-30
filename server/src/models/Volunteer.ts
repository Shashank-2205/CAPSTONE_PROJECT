import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IVolunteer extends Document {
  user: Types.ObjectId;
  skills: string[];
  availabilityStatus: 'Available' | 'On route' | 'Unavailable';
  emergencyContact?: string;
  location: string;
  serviceRadiusKm?: number;
  coordinates?: { type: 'Point'; coordinates: [number, number] };
  verificationStatus: 'Unverified' | 'Verified' | 'Rejected';
  totalTasks: number;
  completedTasks: number;
  createdAt: Date;
  updatedAt: Date;
}

const VolunteerSchema = new Schema<IVolunteer>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    skills: { type: [String], default: [] },
    availabilityStatus: { type: String, enum: ['Available', 'On route', 'Unavailable'], default: 'Available' },
    emergencyContact: { type: String },
    location: { type: String, required: true },
    serviceRadiusKm: { type: Number, default: 25 },
    coordinates: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number], default: [0, 0] },
    },
    verificationStatus: { type: String, enum: ['Unverified', 'Verified', 'Rejected'], default: 'Unverified' },
    totalTasks: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// user index created automatically via unique: true
VolunteerSchema.index({ availabilityStatus: 1 });
VolunteerSchema.index({ 'coordinates.coordinates': '2dsphere' });

export const Volunteer = mongoose.model<IVolunteer>('Volunteer', VolunteerSchema);
