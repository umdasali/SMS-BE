import mongoose, { Document, Schema } from 'mongoose';

export interface IAssetAssignment extends Document {
  tenantId: mongoose.Types.ObjectId;
  assetId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  assignedDate: Date;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const AssetAssignmentSchema = new Schema<IAssetAssignment>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    assetId: { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    assignedDate: { type: Date, default: Date.now },
    notes: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model<IAssetAssignment>('AssetAssignment', AssetAssignmentSchema);
