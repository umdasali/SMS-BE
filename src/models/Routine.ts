import mongoose, { Document, Schema } from 'mongoose';

interface IPeriod {
  startTime: string;
  endTime: string;
  subjectId?: mongoose.Types.ObjectId;
  teacherId?: mongoose.Types.ObjectId;
  room: string;
}

interface IDaySchedule {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  periods: IPeriod[];
}

export interface IRoutine extends Document {
  tenantId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  sectionId: string;
  academicYear: string;
  schedule: IDaySchedule[];
  createdAt: Date;
  updatedAt: Date;
}

const PeriodSchema = new Schema<IPeriod>({
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  subjectId: { type: Schema.Types.ObjectId, ref: 'Subject' },
  teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher' },
  room: { type: String, default: '' },
});

const DayScheduleSchema = new Schema<IDaySchedule>({
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    required: true,
  },
  periods: [PeriodSchema],
});

const RoutineSchema = new Schema<IRoutine>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    sectionId: { type: String, default: '' },
    academicYear: { type: String, required: true },
    schedule: [DayScheduleSchema],
  },
  { timestamps: true }
);

RoutineSchema.index({ tenantId: 1, classId: 1, sectionId: 1, academicYear: 1 }, { unique: true });

export default mongoose.model<IRoutine>('Routine', RoutineSchema);
