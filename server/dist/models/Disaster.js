import mongoose, { Schema } from 'mongoose';
const DisasterSchema = new Schema({
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
}, { timestamps: true });
// disasterId index created automatically via unique: true
DisasterSchema.index({ status: 1 });
DisasterSchema.index({ 'coordinates.coordinates': '2dsphere' });
export const Disaster = mongoose.model('Disaster', DisasterSchema);
