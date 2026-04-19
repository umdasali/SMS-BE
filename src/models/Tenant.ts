import mongoose, { Document, Schema } from 'mongoose';

export interface ITenant extends Document {
  name: string;
  type: 'school' | 'college' | 'university' | 'institute';
  address: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  email: string;
  schoolCode: string;
  status: 'active' | 'inactive' | 'pending';
  branding: {
    primaryColor: 'green' | 'blue' | 'pink' | 'purple' | 'orange' | 'indigo' | 'teal' | 'cyan' | 'amber' | 'emerald' | 'rose' | 'slate' | 'crimson';
    logo: string;
    favicon: string;
    schoolName: string;
    marksheetTemplate: 'standard' | 'modern' | 'minimal' | 'royal' | 'pearl';
    certificateTemplate: 'classic' | 'elegant' | 'modern' | 'royal' | 'pearl';
  };
  subscription: {
    plan: 'free' | 'basic' | 'pro' | 'enterprise';
    /** SaaS admin–controlled status — distinct from tenant.status */
    status: 'active' | 'suspended' | 'expired';
    expiresAt: Date;
    /** Billing rate in INR per active student per month (default ₹20) */
    pricePerStudent: number;
    lastPaymentDate?: Date;
    notes?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const TenantSchema = new Schema<ITenant>(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['school', 'college', 'university', 'institute'], required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true, default: 'India' },
    phone: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    schoolCode: { type: String, required: true, unique: true, lowercase: true, trim: true },
    status: { type: String, enum: ['active', 'inactive', 'pending'], default: 'active' },
    branding: {
      primaryColor: {
        type: String,
        enum: ['green', 'blue', 'pink', 'purple', 'orange', 'indigo', 'teal', 'cyan', 'amber', 'emerald', 'rose', 'slate', 'crimson'],
        default: 'blue',
      },
      logo: { type: String, default: '' },
      favicon: { type: String, default: '' },
      schoolName: { type: String, default: '' },
      marksheetTemplate: { type: String, enum: ['standard', 'modern', 'minimal', 'royal', 'pearl'], default: 'standard' },
      certificateTemplate: { type: String, enum: ['classic', 'elegant', 'modern', 'royal', 'pearl'], default: 'classic' },
    },
    subscription: {
      plan: { type: String, enum: ['free', 'basic', 'pro', 'enterprise'], default: 'free' },
      status: { type: String, enum: ['active', 'suspended', 'expired'], default: 'active' },
      expiresAt: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      pricePerStudent: { type: Number, default: 20 },
      lastPaymentDate: { type: Date },
      notes: { type: String, default: '' },
    },
  },
  { timestamps: true },
);

export default mongoose.model<ITenant>('Tenant', TenantSchema);
