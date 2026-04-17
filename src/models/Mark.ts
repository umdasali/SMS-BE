import mongoose, { Document, Schema } from 'mongoose';

export interface IMark extends Document {
  tenantId: mongoose.Types.ObjectId;
  examId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  obtained: number;
  total: number;
  grade: string;
  remarks: string;
  enteredBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MarkSchema = new Schema<IMark>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    obtained: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    grade: { type: String, default: '' },
    remarks: { type: String, default: '' },
    enteredBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

MarkSchema.index({ tenantId: 1, examId: 1, studentId: 1, subjectId: 1 }, { unique: true });

MarkSchema.pre('save', function () {
  const mark = this as IMark;
  const percentage = (mark.obtained / mark.total) * 100;
  if (percentage >= 90) mark.grade = 'A+';
  else if (percentage >= 80) mark.grade = 'A';
  else if (percentage >= 70) mark.grade = 'B+';
  else if (percentage >= 60) mark.grade = 'B';
  else if (percentage >= 50) mark.grade = 'C+';
  else if (percentage >= 40) mark.grade = 'C';
  else if (percentage >= 33) mark.grade = 'D';
  else mark.grade = 'F';
});

export default mongoose.model<IMark>('Mark', MarkSchema);
