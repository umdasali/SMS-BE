import mongoose, { Document, Schema } from 'mongoose';

export interface IAnnouncement extends Document {
  tenantId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  targetAudience: 'all' | 'students' | 'teachers';
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    targetAudience: {
      type: String,
      enum: ['all', 'students', 'teachers'],
      default: 'all',
    },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

AnnouncementSchema.index({ tenantId: 1, createdAt: -1 });

export default mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);
