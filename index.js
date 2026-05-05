const express = require('express');
const IntaSend = require('intasend-node');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize IntaSend
const intasend = new IntaSend(
    process.env.INTASEND_PUBLISHABLE_KEY,
    process.env.INTASEND_SECRET_KEY,
    process.env.INTASEND_ENVIRONMENT || 'sandbox'
);

// STK Push endpoint
app.post('/api/mpesa/stkpush', async (req, res) => {
    try {
        const { phone, amount, reference } = req.body;

        // phone must be in format 2547XXXXXXXX
        const cleanedPhone = phone.replace(/\D/g, '');
        if (!cleanedPhone.startsWith('254')) {
            return res.status(400).json({ error: 'Phone must start with 254 (e.g., 254712345678)' });
        }

        const response = await intasend.collect.mpesaStkPush(
            cleanedPhone,
            parseFloat(amount),
            reference || `INV_${Date.now()}`
        );

        res.json({ success: true, data: response });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Serve your HTML page (optional)
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
