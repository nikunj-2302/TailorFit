import mongoose from 'mongoose';

const personSchema = new mongoose.Schema({
  personId: {
    type: String, // Employee ID or auto/custom Person ID
    trim: true,
  },
  fullName: {
    type: String,
    required: [true, 'Full Name is required'],
    trim: true,
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Unisex'],
    required: [true, 'Gender is required'],
    default: 'Male',
  },
  mobileNumber: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
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
  department: {
    type: String,
    trim: true,
  },
  designation: {
    type: String,
    trim: true,
  },
  professionType: {
    type: String, // e.g. Doctor, Nurse, Security, Manager, Staff, etc.
    required: [true, 'Profession / Role Type is required'],
    default: 'Staff',
    trim: true,
  },
  notes: {
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

personSchema.index({ fullName: 'text', personId: 'text', mobileNumber: 'text' });
personSchema.index({ organization: 1, branch: 1 });

export default mongoose.model('Person', personSchema);
