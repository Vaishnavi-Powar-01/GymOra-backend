const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: ['https://gym-ora-frontend.vercel.app/'],
  credentials: true,
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use("/api/uploads", express.static('uploads'));
console.log("EMAIL USER:", process.env.EMAIL_USER);
const subscribeRoute = require("./routes/subscribe");

// Routes
app.use("/api/enquiry", require("./routes/enquiryRoutes.js"));
app.use("/api/users", require("./routes/userRoutes.js"));
app.use("/api/products", require("./routes/productRoutes.js"));
app.use("/api/categories", require("./routes/categoryRoutes.js"));
app.use("/api/banners", require("./routes/bannerRoutes.js"));
app.use("/api/contact", require("./routes/contact.js"));
app.use("/api/address", require("./routes/addressRoutes.js"));
app.use("/api/upload", require("./routes/uploadRoutes.js"));
app.use("/api/blogs", require("./routes/blogRoutes.js")); 
app.use("/api/subscribe", subscribeRoute);


// Root route
app.get("/", (req, res) => {
  res.json({ message: "API is running...", status: "OK" });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/irontribe";

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Atlas connected");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });