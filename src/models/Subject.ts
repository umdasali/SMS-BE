import mongoose, { Document, Schema } from 'mongoose';

export interface ISubject extends Document {
  tenantId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  name: string;
  code: string;
  teacherId?: mongoose.Types.ObjectId;
  fullMarks: number;
  passMarks: number;
  createdAt: Date;
  updatedAt: Date;
}

const SubjectSchema = new Schema<ISubject>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher' },
    fullMarks: { type: Number, default: 100 },
    passMarks: { type: Number, default: 33 },
  },
  { timestamps: true }
);

SubjectSchema.index({ tenantId: 1, classId: 1, code: 1 }, { unique: true });

export default mongoose.model<ISubject>('Subject', SubjectSchema);
