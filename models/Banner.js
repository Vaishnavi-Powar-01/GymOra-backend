const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: String,
  subtitle: String,
  buttonText: String,
  backgroundImage: String,
});

module.exports = mongoose.model('Banner', bannerSchema);
