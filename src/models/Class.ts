import mongoose, { Document, Schema } from 'mongoose';

export interface ISection {
  name: string;
  teacherId?: mongoose.Types.ObjectId;
}

export interface IClass extends Document {
  tenantId: mongoose.Types.ObjectId;
  name: string;
  sections: ISection[];
  academicYear: string;
  createdAt: Date;
  updatedAt: Date;
}

const SectionSchema = new Schema<ISection>({
  name: { type: String, required: true },
  teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher' },
});

const ClassSchema = new Schema<IClass>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    name: { type: String, required: true, trim: true },
    sections: [SectionSchema],
    academicYear: { type: String, required: true },
  },
  { timestamps: true }
);

ClassSchema.index({ tenantId: 1, name: 1, academicYear: 1 }, { unique: true });

export default mongoose.model<IClass>('Class', ClassSchema);
