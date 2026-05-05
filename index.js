const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("🚀 LIVE IntaSend API running");
});

// 🔥 PAYMENT ROUTE (LIVE)
app.post("/pay", async (req, res) => {
  const { phone, amount } = req.body;

  try {
    const response = await fetch("https://api.intasend.com/api/v1/payment/collection/", {
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
        email: "user@example.com",
        first_name: "Customer",
        last_name: "User",
        redirect_url: "https://yourdomain.com/success.html"
      })
    });

    const data = await response.json();

    if (data.url) {
      res.json(data);
    } else {
      res.status(400).json(data);
    }

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// 🔔 WEBHOOK (VERY IMPORTANT)
app.post("/callback", (req, res) => {
  console.log("Payment update:", req.body);

  // Example:
  if (req.body.state === "COMPLETE") {
    console.log("✅ Payment successful");
    // TODO: update DB / grant access
  }

  res.sendStatus(200);
});


// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running"));
