const express = require('express');
const router = express.Router();
const Banner = require('../models/Banner');
const upload = require('../middleware/upload'); // 👈 Importing upload middleware
const path = require('path');
const fs = require('fs');

// GET all banners
router.get('/', async (req, res) => {
  try {
    const banners = await Banner.find();
    res.json(banners);
  } catch (err) {
    console.error('GET error:', err);
    res.status(500).json({ message: 'Error fetching banners' });
  }
});

// POST new banner with image
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { title, subtitle, buttonText } = req.body;
    const backgroundImage = req.file ? `/uploads/${req.file.filename}` : '';
    
    const banner = new Banner({ 
      title, 
      subtitle, 
      buttonText, 
      backgroundImage 
    });
    
    await banner.save();
    res.status(201).json(banner);
  } catch (err) {
    console.error('POST error:', err);
    res.status(500).json({ message: 'Error creating banner' });
  }
});

// PUT update banner
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const { title, subtitle, buttonText } = req.body;
    const banner = await Banner.findById(req.params.id);
    
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    // Fetch the existing banner to get current image path for deletion
    const existingBanner = await Banner.findById(req.params.id);

    banner.title = title;
    banner.subtitle = subtitle;
    banner.buttonText = buttonText;

    // Handle new image and delete old one if new file is uploaded
    if (req.file) {
      // Delete old image from file system
      if (existingBanner.backgroundImage) {
        const fullPath = path.join(__dirname, "..", existingBanner.backgroundImage);
        fs.unlink(fullPath, (err) => {
          if (err)
            console.error(
              `Failed to delete image ${existingBanner.backgroundImage}:`,
              err.message
            );
        });
      }
      banner.backgroundImage = `/uploads/${req.file.filename}`;
    }

    await banner.save();
    res.json(banner);
  } catch (err) {
    console.error('PUT error:', err);
    res.status(500).json({ message: 'Error updating banner' });
  }
});

// DELETE banner
router.delete('/:id', async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }
    
    res.json({ message: 'Banner deleted successfully' });
  } catch (err) {
    console.error('DELETE error:', err);
    res.status(500).json({ message: 'Error deleting banner' });
  }
});

module.exports = router;