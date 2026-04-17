import mongoose, { Document, Schema } from 'mongoose';

export interface IPayslip extends Document {
  tenantId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  month: number; // 1-12
  year: number;
  baseSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  paymentDate?: Date;
  status: 'pending' | 'paid';
  remarks: string;
  createdAt: Date;
  updatedAt: Date;
}

const PayslipSchema = new Schema<IPayslip>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    baseSalary: { type: Number, required: true },
    allowances: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    netSalary: { type: Number, required: true },
    paymentDate: { type: Date },
    status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
    remarks: { type: String, default: '' },
  },
  { timestamps: true }
);

PayslipSchema.index({ tenantId: 1, teacherId: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.model<IPayslip>('Payslip', PayslipSchema);
