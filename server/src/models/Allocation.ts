import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAllocation extends Document {
  allocationId: string;
  resource: Types.ObjectId;
  emergency: Types.ObjectId;
  quantity: number;
  recipient: string;
  status: 'Queued' | 'Dispatched' | 'Delivered' | 'Cancelled';
  dispatchedAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AllocationSchema = new Schema<IAllocation>(
  {
    allocationId: { type: String, required: true, unique: true },
    resource: { type: Schema.Types.ObjectId, ref: 'Resource', required: true },
    emergency: { type: Schema.Types.ObjectId, ref: 'Emergency', required: true },
    quantity: { type: Number, required: true, min: 0 },
    recipient: { type: String, required: true },
    status: { type: String, enum: ['Queued', 'Dispatched', 'Delivered', 'Cancelled'], default: 'Queued' },
    dispatchedAt: { type: Date },
    deliveredAt: { type: Date },
  },
  { timestamps: true },
);

// allocationId index created automatically via unique: true
AllocationSchema.index({ resource: 1 });
AllocationSchema.index({ emergency: 1 });
AllocationSchema.index({ status: 1 });

export const Allocation = mongoose.model<IAllocation>('Allocation', AllocationSchema);
