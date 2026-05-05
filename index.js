const express = require("express");
const cors = require("cors");
const IntaSend = require("intasend-node");

const app = express();

app.use(cors());
app.use(express.json());

// 🔑 Initialize IntaSend SDK
const intasend = new IntaSend(
  process.env.PUBLISHABLE_KEY,
  process.env.SECRET_KEY,
  false // false = LIVE mode, true = TEST mode
);

const collection = intasend.collection();

// 🧪 Health check route
app.get("/", (req, res) => {
  res.send("🚀 IntaSend STK Backend Running");
});

// 💳 STK Push route
app.post("/pay", async (req, res) => {
  const { phone, amount } = req.body;

  if (!phone || !amount) {
    return res.status(400).json({
      error: "Phone and amount are required"
    });
  }

  try {
    const response = await collection.mpesaStkPush({
      first_name: "Customer",
      last_name: "User",
      email: "customer@example.com",
      host: "https://your-frontend-domain.com",
      amount: Number(amount),
      phone_number: phone,
      api_ref: "order_" + Date.now()
    });

    console.log("STK Response:", response);

    // Send response back to frontend
    return res.json(response);

  } catch (error) {
    console.error("STK Error:", error);

    return res.status(500).json({
      error: "Payment failed",
      details: error.message || error
    });
  }
});

// 🔔 Webhook (for payment confirmation)
app.post("/callback", (req, res) => {
  console.log("Payment callback received:", req.body);

  // Here you will:
  // - confirm payment
  // - update database (Supabase etc.)
  // - unlock service/product

  res.sendStatus(200);
});

// 🚀 Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
