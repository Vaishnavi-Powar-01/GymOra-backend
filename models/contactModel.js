const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    trim: true
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    enum: ['general', 'membership', 'training', 'support']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['new', 'read', 'replied', 'closed'],
    default: 'new'
  },
  ipAddress: {
    type: String,
    default: 'unknown'
  },
  userAgent: {
    type: String,
    default: 'unknown'
  }
}, {
  timestamps: true
});

contactSchema.index({ email: 1 });
contactSchema.index({ status: 1 });
contactSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Contact', contactSchema);
