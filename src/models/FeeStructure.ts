import mongoose, { Document, Schema } from 'mongoose';

/**
 * FeeStructure — defines the monthly fee for a class.
 * Set once per academic year per class. The monthly-generate
 * endpoint reads these to auto-create FeeSlips without any
 * per-student manual input.
 */
export interface IFeeStructure extends Document {
  tenantId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  academicYear: string;       // e.g. "2024-2025"
  monthlyFee: number;         // base monthly tuition
  admissionFee: number;       // one-time, charged in April/first month only
  examFee: number;            // charged on exam months if needed (optional)
  lateFinePerDay: number;     // auto-fine after dueDay of each month
  dueDay: number;             // day of month payment is due, e.g. 10
  remarks: string;
  createdAt: Date;
  updatedAt: Date;
}

const FeeStructureSchema = new Schema<IFeeStructure>(
  {
    tenantId:      { type: Schema.Types.ObjectId, ref: 'Tenant',  required: true },
    classId:       { type: Schema.Types.ObjectId, ref: 'Class',   required: true },
    academicYear:  { type: String, required: true, trim: true },
    monthlyFee:    { type: Number, required: true, min: 0 },
    admissionFee:  { type: Number, default: 0, min: 0 },
    examFee:       { type: Number, default: 0, min: 0 },
    lateFinePerDay:{ type: Number, default: 0, min: 0 },
    dueDay:        { type: Number, default: 10, min: 1, max: 28 },
    remarks:       { type: String, default: '' },
  },
  { timestamps: true }
);

// One fee structure per class per academic year per tenant
FeeStructureSchema.index(
  { tenantId: 1, classId: 1, academicYear: 1 },
  { unique: true }
);

export default mongoose.model<IFeeStructure>('FeeStructure', FeeStructureSchema);
