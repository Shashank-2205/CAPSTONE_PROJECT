import mongoose, { Schema } from 'mongoose';
const HospitalSchema = new Schema({
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
}, { timestamps: true });
// user and registrationNumber indices created automatically via unique: true
HospitalSchema.index({ 'coordinates.coordinates': '2dsphere' });
export const Hospital = mongoose.model('Hospital', HospitalSchema);
