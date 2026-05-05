const express = require('express');
const IntaSend = require('intasend-node');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------- IntaSend Setup ----------
const PUBLISHABLE_KEY = process.env.INTASEND_PUBLISHABLE_KEY;
const SECRET_KEY = process.env.INTASEND_SECRET_KEY;
const ENVIRONMENT = process.env.INTASEND_ENVIRONMENT || 'sandbox';   // set to 'live' on Render

if (!PUBLISHABLE_KEY || !SECRET_KEY) {
    console.error('❌ Missing IntaSend API keys. Set INTASEND_PUBLISHABLE_KEY and INTASEND_SECRET_KEY.');
    process.exit(1);
}

const intasend = new IntaSend(PUBLISHABLE_KEY, SECRET_KEY, ENVIRONMENT);
console.log(`✅ IntaSend initialized in ${ENVIRONMENT.toUpperCase()} mode`);

// ---------- STK Push Endpoint ----------
app.post('/api/mpesa/stkpush', async (req, res) => {
    console.log('📥 STK request:', req.body);

    try {
        let { phone, amount, reference } = req.body;

        // Validation
        if (!phone || !amount) {
            return res.status(400).json({ success: false, error: 'Phone and amount are required' });
        }

        // Clean phone: remove anything non-digit, must start with 254
        const cleaned = phone.toString().replace(/\D/g, '');
        if (!cleaned.startsWith('254') || cleaned.length !== 12) {
            return res.status(400).json({ success: false, error: 'Phone must be 12 digits starting with 254 (e.g., 254712345678)' });
        }

        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            return res.status(400).json({ success: false, error: 'Amount must be a positive number' });
        }

        const apiRef = reference || `INV_${Date.now()}`;

        // Call IntaSend SDK
        const response = await intasend.collect.mpesaStkPush(cleaned, amountNum, apiRef);

        console.log('📤 IntaSend response:', response);
        res.json({ success: true, data: response });

    } catch (error) {
        console.error('🔥 STK error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ---------- Webhook (callback) Endpoint ----------
app.post('/api/mpesa/callback', (req, res) => {
    console.log('🔔 Webhook received:', JSON.stringify(req.body, null, 2));
    // Here you would update your database, send confirmation email, etc.
    res.status(200).send('OK');
});

// ---------- Serve Frontend ----------
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// ---------- Start Server ----------
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
