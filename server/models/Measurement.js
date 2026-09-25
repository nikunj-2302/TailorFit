import mongoose from 'mongoose';

const measurementValueItemSchema = new mongoose.Schema({
  fieldId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MeasurementField',
  },
  fieldCode: {
    type: String,
    required: true,
  },
  fieldName: {
    type: String,
    required: true,
  },
  value: {
    type: Number,
    required: true,
  },
  unit: {
    type: String,
    default: 'Inch',
  }
}, { _id: false });

const measurementSchema = new mongoose.Schema({
  measurementNumber: {
    type: String,
    required: true,
  },
  person: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Person',
    required: [true, 'Person is required'],
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization is required'],
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
  },
  garment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GarmentType',
    required: [true, 'Garment is required'],
  },
  template: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MeasurementTemplate',
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Unisex'],
  },
  professionType: {
    type: String,
  },
  unit: {
    type: String,
    enum: ['Inch', 'cm'],
    default: 'Inch',
  },
  values: [measurementValueItemSchema],
  version: {
    type: Number,
    default: 1,
  },
  isLatest: {
    type: Boolean,
    default: true,
  },
  previousVersion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Measurement',
    default: null,
  },
  notes: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['Active', 'Archived'],
    default: 'Active',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  isActive: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true,
});

measurementSchema.index({ person: 1, garment: 1, version: 1 });
measurementSchema.index({ measurementNumber: 1 });
measurementSchema.index({ organization: 1, branch: 1 });

export default mongoose.model('Measurement', measurementSchema);
