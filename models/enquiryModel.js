const mongoose = require("mongoose");

const enquirySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  name: {
    type: String,
    required: true,
  },

  phone: {
    type: String,
    required: true,
  },

  city: {
    type: String,
    required: true,
  },

  enquiryType: {
    type: String,
    required: true,
  },

  products: [
    {
      name: String,
      quantity: Number,
      price: Number
    },
  ],

  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Enquiry", enquirySchema);
