const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  street: {
    type: String,
    required: [true, "Street address is required"],
    trim: true,
    maxlength: [200, "Street address cannot exceed 200 characters"]
  },
  city: {
    type: String,
    required: [true, "City is required"],
    trim: true,
    maxlength: [100, "City name cannot exceed 100 characters"]
  },
  state: {
    type: String,
    required: [true, "State is required"],
    trim: true,
    maxlength: [100, "State name cannot exceed 100 characters"]
  },
  zip: {
    type: String,
    required: [true, "ZIP code is required"],
    trim: true,
    maxlength: [20, "ZIP code cannot exceed 20 characters"]
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries by user
addressSchema.index({ userId: 1 });

// Ensure only one default address per user
addressSchema.pre('save', async function(next) {
  if (this.isDefault) {
    await this.constructor.updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

module.exports = mongoose.model("Address", addressSchema);