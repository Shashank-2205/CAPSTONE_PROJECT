import mongoose, { Schema } from 'mongoose';
const EmergencySchema = new Schema({
    emergencyId: { type: String, required: true, unique: true },
    type: {
        type: String,
        enum: ['Medical', 'Trapped Person', 'Fire', 'Flood', 'Evacuation', 'Missing Person', 'Food/Water', 'Other'],
        required: true,
    },
    description: { type: String, required: true },
    priority: { type: String, enum: ['Critical', 'High', 'Medium', 'Low'], required: true },
    status: {
        type: String,
        enum: ['Pending', 'Verified', 'Assigned', 'In Progress', 'Resolved', 'Rejected'],
        default: 'Pending',
    },
    location: { type: String, required: true },
    address: { type: String },
    coordinates: {
        type: { type: String, enum: ['Point'] },
        coordinates: { type: [Number], default: [0, 0] },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date },
    assignedVolunteer: { type: Schema.Types.ObjectId, ref: 'Volunteer' },
    assignedTask: { type: Schema.Types.ObjectId, ref: 'Task' },
    resolvedAt: { type: Date },
    cancelledAt: { type: Date },
    attachments: { type: [String] },
}, { timestamps: true });
// emergencyId index created automatically via unique: true
EmergencySchema.index({ status: 1 });
EmergencySchema.index({ priority: 1 });
EmergencySchema.index({ 'coordinates.coordinates': '2dsphere' });
export const Emergency = mongoose.model('Emergency', EmergencySchema);
