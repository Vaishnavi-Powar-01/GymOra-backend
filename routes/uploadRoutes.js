const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');

router.post('/', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.status(200).json({ imageUrl: fileUrl });
});

module.exports = router;