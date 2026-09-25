import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Organization Name is required'],
    trim: true,
  },
  code: {
    type: String,
    required: [true, 'Organization Code is required'],
    unique: true,
    uppercase: true,
    trim: true,
  },
  type: {
    type: String,
    required: [true, 'Organization Type is required'],
    default: 'Corporate',
    trim: true,
  },
  contactPerson: {
    type: String,
    trim: true,
  },
  contactNumber: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  city: {
    type: String,
    trim: true,
  },
  state: {
    type: String,
    trim: true,
  },
  country: {
    type: String,
    default: 'India',
    trim: true,
  },
  pincode: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Pending'],
    default: 'Active',
  },
  notes: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true,
});

organizationSchema.index({ name: 'text', code: 'text', city: 'text' });

export default mongoose.model('Organization', organizationSchema);
