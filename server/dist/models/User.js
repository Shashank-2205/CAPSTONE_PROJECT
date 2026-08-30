import mongoose, { Schema } from 'mongoose';
const UserSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['citizen', 'volunteer', 'ngo', 'hospital', 'admin'], required: true },
    phone: { type: String },
    profileImage: { type: String },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    lastLoginAt: { type: Date },
}, { timestamps: true });
// Email index created automatically via unique: true
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
export const User = mongoose.model('User', UserSchema);
