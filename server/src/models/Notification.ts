import mongoose, { Document, Schema, Types } from 'mongoose';

export interface INotification extends Document {
  notificationId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'critical' | 'success';
  recipients?: Types.ObjectId[];
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    notificationId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['info', 'warning', 'critical', 'success'], default: 'info' },
    recipients: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// notificationId index created automatically via unique: true
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
