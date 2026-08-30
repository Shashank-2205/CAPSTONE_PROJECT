import mongoose, { Schema } from 'mongoose';
const NGOSchema = new Schema({
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
}, { timestamps: true });
// user and registrationNumber indices created automatically via unique: true
NGOSchema.index({ 'coordinates.coordinates': '2dsphere' });
export const NGO = mongoose.model('NGO', NGOSchema);
