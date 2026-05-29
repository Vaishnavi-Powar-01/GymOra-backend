const express = require("express");
const ProductModel = require("../models/productModel.js");
const upload = require("../middleware/upload"); // 👈 Importing upload middleware
const path = require('path');
const fs = require('fs');
const Category = require("../models/Category.js");

const router = express.Router();

// Utility to generate slug from name
function generateSlug(name) {
  return name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");
}

// Utility to generate unique slug
async function generateUniqueSlug(name) {
  let baseSlug = generateSlug(name);
  let slug = baseSlug;
  let count = 1;

  while (await ProductModel.exists({ slug })) {
    slug = `${baseSlug}-${count}`;
    count++;
  }

  return slug;
}

// ✅ POST: Create product
router.post("/", upload.single("image"), async (req, res) => {
  try {
    console.log("Incoming data:", req.body);
    console.log("Uploaded file:", req.file);

    const { name, category, price, length, width, height, description } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : "";
    const slug = await generateUniqueSlug(name);

    const newProduct = new ProductModel({
      name,
      category,
      price,
      length,
      width,
      height,
      description,
      image,
      slug,
    });

    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error) {
    console.error("POST error:", error);
    res.status(500).json({ error: "Failed to create product" });
  }
});

// ✅ PUT: Update product
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const { name, category, price, length, width, height, description } = req.body;

    // Fetch the existing product to get current image path
    const existingProduct = await ProductModel.findById(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    const updateData = {
      name,
      category,
      price,
      length,
      width,
      height,
      description,
    };

    // Only regenerate slug if name is being updated
    if (name && name !== existingProduct.name) {
      updateData.slug = await generateUniqueSlug(name);
    }

    // Handle new image and delete old one if new file is uploaded
    if (req.file) {
      // Delete old image from file system
      if (existingProduct.image) {
        const fullPath = path.join(__dirname, "..", existingProduct.image);
        fs.unlink(fullPath, (err) => {
          if (err)
            console.error(
              `Failed to delete image ${existingProduct.image}:`,
              err.message
            );
        });
      }
      updateData.image = `/uploads/${req.file.filename}`;
    }

    const updatedProduct = await ProductModel.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json(updatedProduct);
  } catch (error) {
    console.error("PUT error:", error);
    res.status(500).json({ error: "Failed to update product" });
  }
});

// ✅ GET all products
router.get("/", async (req, res) => {
  try {
    const populateQuery = req.query.populate === "category" ? 
      [{ path: "category", select: "name" }] : 
      [];
    
    const products = await ProductModel.find().populate(populateQuery);
    res.json(products);
  } catch (error) {
    console.error("GET all products error:", error);
    res.status(500).json({ error: "Failed to get products" });
  }
});
router.get("/slug/:slug", async (req, res) => {
  try {
    const product = await ProductModel.findOne({ slug: req.params.slug }).populate("category");
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (error) {
    console.error("GET product by slug error:", error);
    res.status(500).json({ error: "Failed to get product" });
  }
});

// ✅ GET single product by ID - THIS WAS MISSING!
router.get("/:id", async (req, res) => {
  try {
    const product = await ProductModel.findById(req.params.id).populate("category");
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    console.error("GET product by ID error:", error);
    res.status(500).json({ error: "Failed to get product" });
  }
});

// ✅ GET product by slug (for product detail page)
// router.get("/slug/:slug", async (req, res) => {
//   try {
//     const product = await ProductModel.findOne({ slug: req.params.slug }).populate("category");
//     if (!product) return res.status(404).json({ error: "Product not found" });
//     res.json(product);
//   } catch (error) {
//     console.error("GET product by slug error:", error);
//     res.status(500).json({ error: "Failed to get product" });
//   }
// });

// ✅ GET products by category slug
router.get("/categories/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    // 1. Find category by slug
    const category = await Category.findOne({ slug });

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // 2. Find products that belong to this category (by ObjectId)
    const products = await ProductModel.find({ category: category._id }).populate("category");

    res.status(200).json({
      category: category.name,
      products,
    });
  } catch (error) {
    console.error("Error fetching products by category:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ DELETE product
router.delete("/:id", async (req, res) => {
  try {
    const deletedProduct = await ProductModel.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    // Delete associated image file if it exists
    if (deletedProduct.image) {
      const fullPath = path.join(__dirname, "..", deletedProduct.image);
      fs.unlink(fullPath, (err) => {
        if (err) {
          console.error(`Failed to delete image ${deletedProduct.image}:`, err.message);
        }
      });
    }
    
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("DELETE error:", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

module.exports = router;