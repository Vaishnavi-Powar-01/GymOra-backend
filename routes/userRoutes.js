const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authenticateAdmin = require("../middleware/authAdmin");
const upload = require("../middleware/upload"); // 👈 Importing upload middleware
const path = require('path');
const fs = require('fs');

const JWT_SECRET = process.env.JWT_SECRET || "jwt_secret_key";
const JWT_EXPIRES_IN = "1h";

// 🔹 Public: Get all users (for testing only – ideally remove this or protect it)
router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// 🔹 Public: Signup Route
router.post("/signup", async (req, res) => {
  const { name, email, phone, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      role: "user", 
    });

    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id, name: newUser.name, role: newUser.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: "Signup successful",
      token,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error during signup" });
  }
});

// 🔹 Public: Login Route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error during login" });
  }
});

// 🔹 ✅ Admin-only: Get all users
router.get("/admin/users", authenticateAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (err) {
    console.error("Admin fetch error:", err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// 🔹 ✅ Admin-only: Delete user by ID
router.delete("/admin/users/:id", authenticateAdmin, async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser)
      return res.status(404).json({ message: "User not found" });

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ message: "Delete failed" });
  }
});

// 🔹 ✅ Admin-only: Update user by ID
router.put("/admin/users/:id", authenticateAdmin, async (req, res) => {
  const { name, email, role, phone } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name }),
        ...(email && { email }),
        ...(role && { role }),
        ...(phone && { phone }),
      },
      { new: true }
    ).select("-password");

    if (!updatedUser)
      return res.status(404).json({ message: "User not found" });

    res.json({ message: "User updated", user: updatedUser });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ message: "Update failed" });
  }
});

router.get("/slug/:slug", async (req, res) => {
  try {
    const user = await User.findOne({ slug: req.params.slug });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (err) {
    console.error("User fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 🔹 ✅ NEW: User Profile Update Route (matches frontend expectation)
router.put("/:id", upload.single('profileImage'), async (req, res) => {
  try {
    const { name, email, phone, birthdate } = req.body;
    const userId = req.params.id;

    // Validate required fields
    if (!name || !email || !phone) {
      return res.status(400).json({ message: "Name, email, and phone are required" });
    }

    // Check if email is already taken by another user
    const existingUser = await User.findOne({ 
      email: email, 
      _id: { $ne: userId } 
    });
    
    if (existingUser) {
      return res.status(400).json({ message: "Email is already in use" });
    }

    // Fetch the existing user to get current image path for deletion
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prepare update data
    const updateData = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
    };

    // Add birthdate if provided
    if (birthdate) {
      updateData.birthdate = birthdate;
    }

    // Handle new profile image and delete old one if new file is uploaded
    if (req.file) {
      // Delete old profile image from file system
      if (currentUser.profileImage) {
        const fullPath = path.join(__dirname, "..", currentUser.profileImage);
        fs.unlink(fullPath, (err) => {
          if (err)
            console.error(
              `Failed to delete profile image ${currentUser.profileImage}:`,
              err.message
            );
        });
      }
      updateData.profileImage = `/uploads/${req.file.filename}`;
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    res.status(200).json({
      message: "Profile updated successfully",
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      birthdate: updatedUser.birthdate,
      profileImage: updatedUser.profileImage,
      _id: updatedUser._id
    });

  } catch (error) {
    console.error("Profile update error:", error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: errors.join(', ') });
    }

    // Handle duplicate key errors (email already exists)
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email is already in use" });
    }

    res.status(500).json({ message: "Internal server error" });
  }
});
  
// ✅ EXISTING: Alternative update route
router.put("/update", async (req, res) => {
  try {
    const { _id, name, email, phone } = req.body;

    if (!_id) {
      return res.status(400).json({ message: "User ID required" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      _id,
      { name, email, phone },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;