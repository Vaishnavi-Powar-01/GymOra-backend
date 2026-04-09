const express = require('express');
const router = express.Router();

let Contact;
try {
  Contact = require('../models/contactModel');
  console.log('✅ Contact model loaded');
} catch (error) {
  console.error('❌ Error loading contact model:', error.message);
}

// @route   POST /api/contacts
router.post('/', async (req, res) => {
  if (!Contact) {
    return res.status(500).json({ success: false, message: 'Contact model not available' });
  }

  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const contact = new Contact({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || '',
      subject: subject.trim(),
      message: message.trim(),
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent') || 'unknown'
    });

    const savedContact = await contact.save();

    res.status(201).json({
      success: true,
      message: 'Message sent successfully!',
      data: {
        id: savedContact._id,
        name: savedContact.name,
        email: savedContact.email
      }
    });
  } catch (error) {
    console.error('❌ Error saving contact:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
