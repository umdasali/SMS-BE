import mongoose, { Document, Schema } from 'mongoose';

interface IAttendanceRecord {
  studentId: mongoose.Types.ObjectId;
  status: 'present' | 'absent' | 'late' | 'half-day';
  note: string;
}

export interface IAttendance extends Document {
  tenantId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  sectionId: string;
  date: Date;
  records: IAttendanceRecord[];
  takenBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const AttendanceRecordSchema = new Schema<IAttendanceRecord>({
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'half-day'],
    required: true,
  },
  note: { type: String, default: '' },
});

const AttendanceSchema = new Schema<IAttendance>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    sectionId: { type: String, default: '' },
    date: { type: Date, required: true },
    records: [AttendanceRecordSchema],
    takenBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

AttendanceSchema.index({ tenantId: 1, classId: 1, sectionId: 1, date: 1 }, { unique: true });

export default mongoose.model<IAttendance>('Attendance', AttendanceSchema);
