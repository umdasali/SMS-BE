import mongoose, { Document, Schema } from 'mongoose';

export interface IStudent extends Document {
  tenantId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  admissionNo: string;
  rollNo: string;
  classId: mongoose.Types.ObjectId;
  sectionId: string;
  name: string;
  dob: Date;
  gender: 'male' | 'female' | 'other';
  bloodGroup: string;
  religion: string;
  nationality: string;
  photo: string;
  govtId: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  parent: {
    fatherName: string;
    motherName: string;
    guardianName: string;
    guardianPhone: string;
    guardianEmail: string;
    guardianRelation: string;
  };
  previousSchool: string;
  admissionDate: Date;
  status: 'active' | 'inactive' | 'graduated' | 'transferred';
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    admissionNo: { type: String, required: true },
    rollNo: { type: String, default: '' },
    classId: { type: Schema.Types.ObjectId, ref: 'Class' },
    sectionId: { type: String, default: '' },
    name: { type: String, required: true, trim: true },
    dob: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    bloodGroup: { type: String, default: '' },
    religion: { type: String, default: '' },
    nationality: { type: String, default: 'Indian' },
    photo: { type: String, default: '' },
    govtId: { type: String, default: '' },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      zip: { type: String, default: '' },
      country: { type: String, default: 'India' },
    },
    parent: {
      fatherName: { type: String, default: '' },
      motherName: { type: String, default: '' },
      guardianName: { type: String, default: '' },
      guardianPhone: { type: String, default: '' },
      guardianEmail: { type: String, default: '' },
      guardianRelation: { type: String, default: '' },
    },
    previousSchool: { type: String, default: '' },
    admissionDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['active', 'inactive', 'graduated', 'transferred'],
      default: 'active',
    },
  },
  { timestamps: true }
);

StudentSchema.index({ tenantId: 1, admissionNo: 1 }, { unique: true });
StudentSchema.index({ tenantId: 1, classId: 1 });

export default mongoose.model<IStudent>('Student', StudentSchema);
