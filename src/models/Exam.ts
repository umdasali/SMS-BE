import mongoose, { Document, Schema } from 'mongoose';

export interface IExam extends Document {
  tenantId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  name: string;
  type: 'unit' | 'mid' | 'final' | 'practical' | 'assignment';
  academicYear: string;
  term: string;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ExamSchema = new Schema<IExam>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['unit', 'mid', 'final', 'practical', 'assignment'],
      required: true,
    },
    academicYear: { type: String, required: true },
    term: { type: String, default: '' },
    startDate: { type: Date },
    endDate: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<IExam>('Exam', ExamSchema);
