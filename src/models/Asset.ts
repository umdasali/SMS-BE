import mongoose, { Document, Schema } from 'mongoose';

export interface IAsset extends Document {
  tenantId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const AssetSchema = new Schema<IAsset>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model<IAsset>('Asset', AssetSchema);
