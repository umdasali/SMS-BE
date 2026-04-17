import mongoose, { Document, Schema } from 'mongoose';

export interface ITeacher extends Document {
  tenantId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  employeeId: string;
  name: string;
  dob: Date;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email: string;
  photo: string;
  govtId: string;
  panCard: string;
  salary: number;
  qualification: string;
  specialization: string;
  experience: number;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  joinDate: Date;
  designation: string;
  subjectIds: mongoose.Types.ObjectId[];
  classIds: mongoose.Types.ObjectId[];
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const TeacherSchema = new Schema<ITeacher>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    employeeId: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    dob: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    phone: { type: String, default: '' },
    email: { type: String, required: true, lowercase: true },
    photo: { type: String, default: '' },
    govtId: { type: String, default: '' },
    panCard: { type: String, default: '' },
    salary: { type: Number, default: 0 },
    qualification: { type: String, default: '' },
    specialization: { type: String, default: '' },
    experience: { type: Number, default: 0 },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      zip: { type: String, default: '' },
      country: { type: String, default: 'India' },
    },
    joinDate: { type: Date, default: Date.now },
    designation: { type: String, default: 'Teacher' },
    subjectIds: [{ type: Schema.Types.ObjectId, ref: 'Subject' }],
    classIds: [{ type: Schema.Types.ObjectId, ref: 'Class' }],
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

TeacherSchema.index({ tenantId: 1, employeeId: 1 }, { unique: true });

export default mongoose.model<ITeacher>('Teacher', TeacherSchema);
