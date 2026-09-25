import mongoose from 'mongoose';

const measurementFieldSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Field Name is required'],
    trim: true,
  },
  code: {
    type: String,
    required: [true, 'Field Code is required'],
    unique: true,
    uppercase: true,
    trim: true,
  },
  category: {
    type: String,
    enum: ['Upper Body', 'Lower Body', 'Suit / Blazer', "Women's Measurements", 'Other'],
    default: 'Upper Body',
  },
  unit: {
    type: String,
    enum: ['Inch', 'cm'],
    default: 'Inch',
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

measurementFieldSchema.index({ code: 1, category: 1 });

export default mongoose.model('MeasurementField', measurementFieldSchema);
