import mongoose from 'mongoose';

const garmentTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Garment Type Name is required'],
    trim: true,
  },
  code: {
    type: String,
    required: [true, 'Garment Code is required'],
    unique: true,
    uppercase: true,
    trim: true,
  },
  category: {
    type: String,
    enum: ['Professional / Uniform', 'Clothing', 'Uniform', 'Other'],
    default: 'Clothing',
  },
  applicableGenders: {
    type: [String],
    enum: ['Male', 'Female', 'Unisex'],
    default: ['Male', 'Female', 'Unisex'],
  },
  description: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
  },
  isActive: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true,
});

garmentTypeSchema.index({ name: 1, category: 1 });

export default mongoose.model('GarmentType', garmentTypeSchema);
