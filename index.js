const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("🚀 IntaSend API is running");
});

// Payment route
app.post("/pay", async (req, res) => {
  const { phone, amount } = req.body;

  try {
    const response = await fetch("https://sandbox.intasend.com/api/v1/payment/collection/", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.SECRET_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        public_key: process.env.PUBLISHABLE_KEY,
        currency: "KES",
        amount: amount,
        phone_number: phone,
        email: "test@example.com",
        first_name: "User",
        last_name: "Test",
        redirect_url: "https://yourwebsite.com/success"
      })
    });

    const data = await response.json();

    if (data.url) {
      res.json(data);
    } else {
      res.status(400).json({ error: data });
    }

  } catch (error) {
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
