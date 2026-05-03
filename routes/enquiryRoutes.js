const express = require("express");
const router = express.Router();
const Enquiry = require("../models/enquiryModel");
const sendEmail = require("../services/sendEmail");
const User = require("../models/User");


// ✅ Get enquiries by user
router.get("/user/:userId", async (req, res) => {
  try {
    const enquiries = await Enquiry.find({ userId: req.params.userId });
    res.status(200).json(enquiries);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch enquiries" });
  }
});


// ✅ Submit enquiry + send email
router.post("/", async (req, res) => {
  console.log("🔥 GymOra Enquiry Received");

  const {
    name,
    email,
    phone,
    city,
    enquiryType,
    products,
    userId
  } = req.body;

  try {
    // ✅ Calculate total
    const totalAmount = products.reduce(
      (sum, p) => sum + (p.price || 0) * (p.quantity || 1),
      0
    );

    // ✅ Clean products
    const updatedProducts = products.map((p) => ({
      name: p.name,
      quantity: p.quantity || 1,
      price: p.price || 0,
    }));

    console.log("Incoming products:", products);

    // ✅ Save enquiry
    const enquiry = new Enquiry({
      userId,
      name,
      email,
      phone,
      city,
      enquiryType,
      products: updatedProducts,
      totalAmount
    });

    await enquiry.save();
    console.log("✅ Enquiry saved");

    // =========================
    // ✅ FIXED EMAIL LOGIC
    // =========================

    let finalEmail = email;

    // 👉 If email not sent from frontend → get from DB
    if (!finalEmail && userId) {
      const user = await User.findById(userId);
      finalEmail = user?.email;
    }
    
    if (finalEmail) {
      await sendEmail({
        to: finalEmail,
        subject: "GymOra – Enquiry Received",
        html: `
          <div style="font-family: Arial, sans-serif">

            <h2>Thank You for Your Enquiry 💪</h2>

            <p>Hello <strong>${name}</strong>,</p>

            <p>Your enquiry has been successfully received.</p>
            <p>We will contact you shortly.</p>

            <hr/>

            <h3>Your Details</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>City:</strong> ${city}</p>
            <p><strong>Enquiry Type:</strong> ${enquiryType}</p>

            <hr/>

            <h3>Selected Products</h3>
            <ul>
              ${updatedProducts
                .map(
                  (p) =>
                    `<li>${p.name} × ${p.quantity} = ₹${
                      p.price * p.quantity
                    }</li>`
                )
                .join("")}
            </ul>

            <h3>Total Amount: ₹${totalAmount}</h3>

            <br/>

            <strong>— Team GymOra</strong>

          </div>
        `,
      });

      console.log("📧 Email sent successfully");
    } else {
      console.log("❌ No email found to send");
    }

    res.status(201).json({
      success: true,
      message: "Enquiry submitted and email sent",
    });

  } catch (error) {
    console.error("❌ GymOra Enquiry Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to submit enquiry",
      error: error.message,
    });
  }
});
// ✅ Get enquiry by ID
router.get("/:id", async (req, res) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id);

    if (!enquiry) {
      return res.status(404).json({ message: "Enquiry not found" });
    }

    res.status(200).json(enquiry);
  } catch (err) {
    res.status(500).json({ message: "Error fetching enquiry" });
  }
});




// ✅ Get all enquiries (Admin)
router.get("/", async (req, res) => {
  try {

    const enquiries = await Enquiry.find()
      .sort({ createdAt: -1 });

    res.status(200).json(enquiries);

  } catch (err) {

    res.status(500).json({
      message: "Error fetching enquiries",
    });

  }
});



// ✅ Update enquiry status
router.put("/:id/status", async (req, res) => {

  const { status } = req.body;

  if (!["Pending", "Approved", "Rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {

    const updated = await Enquiry.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    res.status(200).json(updated);

  } catch (err) {

    res.status(500).json({
      message: "Failed to update status",
    });

  }
});

module.exports = router;
