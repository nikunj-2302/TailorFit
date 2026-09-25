import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  garment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GarmentType',
    required: true,
  },
  measurement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Measurement',
  },
  fabricRequired: {
    type: String,
    trim: true,
  },
  fabricProvidedByCustomer: {
    type: Boolean,
    default: false,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  price: {
    type: Number,
    default: 0,
    min: 0,
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
  },
  total: {
    type: Number,
    default: 0,
    min: 0,
  },
  notes: {
    type: String,
    trim: true,
  }
}, { _id: true });

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
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
  person: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Person',
    required: [true, 'Person is required'],
  },
  items: [orderItemSchema],
  orderDate: {
    type: Date,
    default: Date.now,
  },
  deliveryDate: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['Measurement', 'Cutting', 'Stitching', 'Quality Check', 'Ready', 'Delivered', 'Cancelled'],
    default: 'Measurement',
  },
  totalAmount: {
    type: Number,
    default: 0,
  },
  notes: {
    type: String,
    trim: true,
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

orderSchema.index({ organization: 1, branch: 1, person: 1 });
orderSchema.index({ status: 1 });

export default mongoose.model('Order', orderSchema);
