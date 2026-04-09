const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    content: { type: String, required: true },
    image: { type: String }, // blog thumbnail
    videoUrl: { type: String }, // YouTube or video link
  },
  { timestamps: true }
);

module.exports = mongoose.model("Blog", blogSchema);
