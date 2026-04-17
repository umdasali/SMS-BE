import mongoose, { Document, Schema } from 'mongoose';

export interface ICertificate extends Document {
  tenantId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  type: 'transfer' | 'bonafide' | 'character' | 'completion' | 'merit';
  content: Record<string, unknown>;
  issuedDate: Date;
  issuedBy: mongoose.Types.ObjectId;
  serialNo: string;
  status: 'issued' | 'revoked';
  createdAt: Date;
  updatedAt: Date;
}

const CertificateSchema = new Schema<ICertificate>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    type: {
      type: String,
      enum: ['transfer', 'bonafide', 'character', 'completion', 'merit'],
      required: true,
    },
    content: { type: Schema.Types.Mixed, default: {} },
    issuedDate: { type: Date, default: Date.now },
    issuedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    serialNo: { type: String, required: true, unique: true },
    status: { type: String, enum: ['issued', 'revoked'], default: 'issued' },
  },
  { timestamps: true }
);

export default mongoose.model<ICertificate>('Certificate', CertificateSchema);
