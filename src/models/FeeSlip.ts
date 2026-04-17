import mongoose, { Document, Schema } from 'mongoose';

export interface IFeeSlip extends Document {
  tenantId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  month: number;
  year: number;
  dueDate: Date;
  amount: number;
  discount: number;
  fine: number;
  netAmount: number;
  paidAmount: number;
  paymentDate?: Date;
  status: 'pending' | 'partially_paid' | 'paid';
  remarks: string;
  createdAt: Date;
  updatedAt: Date;
}

const FeeSlipSchema = new Schema<IFeeSlip>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    amount: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    fine: { type: Number, default: 0 },
    netAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    paymentDate: { type: Date },
    status: {
      type: String,
      enum: ['pending', 'partially_paid', 'paid'],
      default: 'pending',
    },
    remarks: { type: String, default: '' },
  },
  { timestamps: true }
);

FeeSlipSchema.index({ tenantId: 1, studentId: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.model<IFeeSlip>('FeeSlip', FeeSlipSchema);
