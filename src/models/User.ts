import mongoose, { Document, Schema, ToObjectOptions } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  tenantId?: mongoose.Types.ObjectId;
  name: string;
  email: string;
  username: string;
  password: string;
  role: 'saas_admin' | 'management' | 'teacher' | 'student';
  avatar: string;
  phone: string;
  isActive: boolean;
  refreshToken: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant' },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: {
      type: String,
      enum: ['saas_admin', 'management', 'teacher', 'student'],
      required: true,
    },
    avatar: { type: String, default: '' },
    phone: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    refreshToken: { type: String, default: '' },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        const r = ret as Record<string, unknown>;
        delete r['password'];
        delete r['refreshToken'];
        return r;
      },
    },
  }
);

UserSchema.index({ email: 1, tenantId: 1 }, { unique: true });

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

UserSchema.methods['comparePassword'] = async function (this: IUser, candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);
