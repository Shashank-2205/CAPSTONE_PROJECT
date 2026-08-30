import mongoose, { Schema } from 'mongoose';
const NotificationSchema = new Schema({
    notificationId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['info', 'warning', 'critical', 'success'], default: 'info' },
    recipients: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isRead: { type: Boolean, default: false },
}, { timestamps: true });
// notificationId index created automatically via unique: true
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ createdAt: -1 });
export const Notification = mongoose.model('Notification', NotificationSchema);
