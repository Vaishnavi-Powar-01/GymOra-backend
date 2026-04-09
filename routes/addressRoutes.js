const express = require("express");
const router = express.Router();
const Address = require("../models/address"); // Make sure this path is correct
const authenticateUser = require("../middleware/authUser");

// =============================================================================
// 🏠 ADDRESS MANAGEMENT ROUTES
// =============================================================================

// 🧪 TEMPORARY: Test database connection and model
router.post("/test-db", async (req, res) => {
  try {
    console.log('🧪 Testing database and Address model...');
    
    // Test creating a dummy address (you can delete it later)
    const testAddress = new Address({
      userId: "507f1f77bcf86cd799439011", // Dummy ObjectId for testing
      street: "Test Street 123",
      city: "Test City",
      state: "Test State", 
      zip: "12345"
    });
    
    console.log('💾 Attempting to save test address...');
    const saved = await testAddress.save();
    console.log('✅ Test address saved:', saved._id);
    
    // Delete the test address immediately
    await Address.deleteOne({ _id: saved._id });
    console.log('🗑️ Test address cleaned up');
    
    res.status(200).json({
      success: true,
      message: "Database and Address model working!",
      testId: saved._id
    });
    
  } catch (error) {
    console.error("❌ Database test error:", error);
    res.status(500).json({
      success: false,
      message: "Database test failed",
      error: error.message
    });
  }
});

// 🔹 ✅ Test route to verify authentication is working
router.get("/test-auth", authenticateUser, async (req, res) => {
  try {
    console.log('🔍 Auth test - req.user:', req.user);
    console.log('🔍 Auth test - token header:', req.headers.authorization);
    
    res.status(200).json({
      success: true,
      message: "Authentication working!",
      user: req.user,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("❌ Test auth error:", error);
    res.status(500).json({
      success: false,
      message: "Test failed",
      error: error.message
    });
  }
});

// 🔹 ✅ Test route without authentication
router.post("/test-no-auth", async (req, res) => {
  try {
    console.log('📝 No-auth test route hit - body:', req.body);
    console.log('📝 No-auth test route hit - headers:', req.headers);
    
    res.status(200).json({
      success: true,
      message: "No-auth test route working",
      body: req.body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("❌ No-auth test error:", error);
    res.status(500).json({
      success: false,
      message: "No-auth test failed",
      error: error.message
    });
  }
});

// 🔹 ✅ Get all addresses for authenticated user
router.get("/", authenticateUser, async (req, res) => {
  try {
    console.log('📍 Getting addresses for user:', req.user.id);
    
    const addresses = await Address.find({ userId: req.user.id })
      .sort({ createdAt: -1 }); // Sort by newest first

    console.log('✅ Found addresses:', addresses.length);
    res.status(200).json(addresses);
  } catch (error) {
    console.error("❌ Fetch addresses error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch addresses" 
    });
  }
});

// 🔹 ✅ Add new address for authenticated user
router.post("/", authenticateUser, async (req, res) => {
  try {
    const { street, city, state, zip, isDefault } = req.body;

    console.log('➕ Adding address for user:', req.user.id);
    console.log('📝 Address data:', { street, city, state, zip });

    // Validate required fields
    if (!street || !city || !state || !zip) {
      return res.status(400).json({
        success: false,
        message: "All address fields (street, city, state, zip) are required"
      });
    }

    // Create new address
    const newAddress = new Address({
      userId: req.user.id,
      street: street.trim(),
      city: city.trim(),
      state: state.trim(),
      zip: zip.trim(),
      isDefault: isDefault || false
    });

    const savedAddress = await newAddress.save();
    console.log('✅ Address saved:', savedAddress._id);

    res.status(201).json({
      success: true,
      message: "Address added successfully",
      address: savedAddress
    });

  } catch (error) {
    console.error("❌ Add address error:", error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: errors.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to add address"
    });
  }
});

// 🔹 ✅ Update address for authenticated user
router.put("/:addressId", authenticateUser, async (req, res) => {
  try {
    const { addressId } = req.params;
    const { street, city, state, zip, isDefault } = req.body;

    console.log('✏️ Updating address:', addressId, 'for user:', req.user.id);

    // Validate required fields
    if (!street || !city || !state || !zip) {
      return res.status(400).json({
        success: false,
        message: "All address fields (street, city, state, zip) are required"
      });
    }

    // Find and update address (only if it belongs to the authenticated user)
    const updatedAddress = await Address.findOneAndUpdate(
      { _id: addressId, userId: req.user.id },
      {
        street: street.trim(),
        city: city.trim(),
        state: state.trim(),
        zip: zip.trim(),
        ...(isDefault !== undefined && { isDefault })
      },
      { new: true, runValidators: true }
    );

    if (!updatedAddress) {
      return res.status(404).json({
        success: false,
        message: "Address not found or you don't have permission to update it"
      });
    }

    console.log('✅ Address updated:', updatedAddress._id);

    res.status(200).json({
      success: true,
      message: "Address updated successfully",
      address: updatedAddress
    });

  } catch (error) {
    console.error("❌ Update address error:", error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: errors.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update address"
    });
  }
});

// 🔹 ✅ Delete address for authenticated user
router.delete("/:addressId", authenticateUser, async (req, res) => {
  try {
    const { addressId } = req.params;

    console.log('🗑️ Deleting address:', addressId, 'for user:', req.user.id);

    // Find and delete address (only if it belongs to the authenticated user)
    const deletedAddress = await Address.findOneAndDelete({
      _id: addressId,
      userId: req.user.id
    });

    if (!deletedAddress) {
      return res.status(404).json({
        success: false,
        message: "Address not found or you don't have permission to delete it"
      });
    }

    console.log('✅ Address deleted:', deletedAddress._id);

    res.status(200).json({
      success: true,
      message: "Address deleted successfully"
    });

  } catch (error) {
    console.error("❌ Delete address error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete address"
    });
  }
});

// 🔹 ✅ Get single address by ID for authenticated user
router.get("/:addressId", authenticateUser, async (req, res) => {
  try {
    const { addressId } = req.params;

    console.log('🔍 Getting single address:', addressId, 'for user:', req.user.id);

    const address = await Address.findOne({
      _id: addressId,
      userId: req.user.id
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found"
      });
    }

    res.status(200).json({
      success: true,
      address
    });

  } catch (error) {
    console.error("❌ Get address error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch address"
    });
  }
});

// 🔹 ✅ Set default address for authenticated user
router.patch("/:addressId/set-default", authenticateUser, async (req, res) => {
  try {
    const { addressId } = req.params;

    console.log('⭐ Setting default address:', addressId, 'for user:', req.user.id);

    // Check if address exists and belongs to user
    const address = await Address.findOne({
      _id: addressId,
      userId: req.user.id
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found"
      });
    }

    // Remove default from all user's addresses
    await Address.updateMany(
      { userId: req.user.id },
      { isDefault: false }
    );

    // Set this address as default
    const updatedAddress = await Address.findByIdAndUpdate(
      addressId,
      { isDefault: true },
      { new: true }
    );

    console.log('✅ Default address set:', updatedAddress._id);

    res.status(200).json({
      success: true,
      message: "Default address updated successfully",
      address: updatedAddress
    });

  } catch (error) {
    console.error("❌ Set default address error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to set default address"
    });
  }
});

module.exports = router;