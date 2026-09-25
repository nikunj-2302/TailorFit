import mongoose from 'mongoose';

const templateFieldItemSchema = new mongoose.Schema({
  field: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MeasurementField',
    required: true,
  },
  isRequired: {
    type: Boolean,
    default: true,
  },
  displayOrder: {
    type: Number,
    default: 1,
  },
  unit: {
    type: String,
    enum: ['Inch', 'cm'],
    default: 'Inch',
  },
  minVal: {
    type: Number,
    default: null,
  },
  maxVal: {
    type: Number,
    default: null,
  },
  helpText: {
    type: String,
    trim: true,
  }
}, { _id: false });

const measurementTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Template Name is required'],
    trim: true,
  },
  garment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GarmentType',
    required: [true, 'Garment is required'],
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Unisex'],
    required: [true, 'Gender is required'],
    default: 'Male',
  },
  applicableTypes: {
    type: [String], // e.g. ['Doctor', 'Nurse', 'Staff', 'All']
    default: ['All'],
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null, // Null means global template
  },
  fields: [templateFieldItemSchema],
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

measurementTemplateSchema.index({ garment: 1, gender: 1 });

export default mongoose.model('MeasurementTemplate', measurementTemplateSchema);
