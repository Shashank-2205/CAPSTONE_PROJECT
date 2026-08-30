import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ITask extends Document {
  taskId: string;
  emergency: Types.ObjectId;
  volunteer: Types.ObjectId;
  status: 'Assigned' | 'Accepted' | 'In Progress' | 'Completed' | 'Rejected';
  notes?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    taskId: { type: String, required: true, unique: true },
    emergency: { type: Schema.Types.ObjectId, ref: 'Emergency', required: true },
    volunteer: { type: Schema.Types.ObjectId, ref: 'Volunteer', required: true },
    status: { type: String, enum: ['Assigned', 'Accepted', 'In Progress', 'Completed', 'Rejected'], default: 'Assigned' },
    notes: { type: String },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true },
);

// taskId index created automatically via unique: true
TaskSchema.index({ emergency: 1 });
TaskSchema.index({ volunteer: 1 });
TaskSchema.index({ status: 1 });

export const Task = mongoose.model<ITask>('Task', TaskSchema);
