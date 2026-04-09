const express = require("express");
const Category = require("../models/Category.js");
const upload = require("../middleware/upload"); // 👈 Importing upload middleware
const path = require("path");
const fs = require("fs");

const router = express.Router();

// ✅ Slug generator function
function generateSlug(name) {
  return name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");
}

// ✅ POST: Create category (slug + description added)
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { name, description } = req.body; // ✅ Correct way
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : "";
    const slug = generateSlug(name);

    const newCategory = new Category({
      name,
      description, // ✅ Save description
      imageUrl,
      slug,
    });

    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (error) {
    console.error("POST category error:", error);
    res.status(500).json({ error: "Failed to create category" });
  }
});

// ✅ GET all categories
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    console.error("GET categories error:", error);
    res.status(500).json({ error: "Failed to get categories" });
  }
});

// ✅ PUT: Update category (slug + description update)
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Fetch the existing category to handle old image deletion
    const existingCategory = await Category.findById(req.params.id);

    if (req.body.name) {
      category.name = req.body.name;
      category.slug = generateSlug(req.body.name); // ✅ Update slug
    }

    if (req.body.description) {
      category.description = req.body.description; // ✅ Update description
    }

    // Handle new image and delete old one
    if (req.file) {
      if (existingCategory.imageUrl) {
        const fullPath = path.join(__dirname, "..", existingCategory.imageUrl);
        fs.unlink(fullPath, (err) => {
          if (err) {
            console.error(
              `Failed to delete image ${existingCategory.imageUrl}:`,
              err.message
            );
          }
        });
      }
      category.imageUrl = `/uploads/${req.file.filename}`;
    }

    const updatedCategory = await category.save();
    res.json(updatedCategory);
  } catch (error) {
    console.error("PUT category error:", error);
    res.status(500).json({ error: "Failed to update category" });
  }
});

// ✅ DELETE: Delete category
router.delete("/:id", async (req, res) => {
  try {
    const deletedCategory = await Category.findByIdAndDelete(req.params.id);
    if (!deletedCategory) {
      return res.status(404).json({ error: "Category not found" });
    }
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("DELETE category error:", error);
    res.status(500).json({ error: "Failed to delete category" });
  }
});

module.exports = router;
