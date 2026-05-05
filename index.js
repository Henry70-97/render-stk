// server.js
const express = require('express');
const IntaSend = require('intasend-node');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- IntaSend Initialization ---
const INTASEND_PUBLISHABLE_KEY = process.env.INTASEND_PUBLISHABLE_KEY;
const INTASEND_SECRET_KEY = process.env.INTASEND_SECRET_KEY;

if (!INTASEND_PUBLISHABLE_KEY || !INTASEND_SECRET_KEY) {
    console.error("FATAL: IntaSend API keys are not set in environment variables.");
    // In a production app, you might want to exit the process here.
    // process.exit(1);
}

// Initialize the IntaSend client. Use 'sandbox' for testing, 'live' for production.
const environment = process.env.INTASEND_ENVIRONMENT || 'sandbox';
const intasend = new IntaSend(INTASEND_PUBLISHABLE_KEY, INTASEND_SECRET_KEY, environment);
// --- End IntaSend Initialization ---

// --- STK Push API Endpoint ---
app.post('/api/mpesa/stkpush', async (req, res) => {
    // Log the incoming request for debugging
    console.log('Received STK Push request:', req.body);

    try {
        const { phone, amount, reference } = req.body;

        // --- Input Validation ---
        if (!phone || !amount) {
            return res.status(400).json({ success: false, error: 'Phone number and amount are required.' });
        }

        // Clean and validate phone number (ensure it's in 2547XXXXXXXX format)
        const cleanedPhone = phone.toString().replace(/\D/g, '');
        if (!cleanedPhone.startsWith('254')) {
            return res.status(400).json({ success: false, error: 'Phone number must be in format 254XXXXXXXXX.' });
        }
        if (cleanedPhone.length !== 12) {
            return res.status(400).json({ success: false, error: 'Phone number must be exactly 12 digits after cleaning (e.g., 254712345678).' });
        }

        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({ success: false, error: 'Amount must be a valid positive number.' });
        }
        // --- End Validation ---

        // Prepare the payload for the IntaSend SDK
        const stkPushPayload = {
            phone_number: cleanedPhone,
            amount: numericAmount,
            api_ref: reference || `INV_${Date.now()}`, // Use provided reference or generate one
            // Optional: Add a narrative to explain the charge
            // narrative: `Payment for Order ${reference}`,
        };

        console.log('Calling IntaSend API with payload:', stkPushPayload);

        // Make the call to IntaSend SDK
        const response = await intasend.collect.mpesaStkPush(
            stkPushPayload.phone_number,
            stkPushPayload.amount,
            stkPushPayload.api_ref
        );

        console.log('IntaSend API response:', response);
        res.json({ success: true, data: response });

    } catch (error) {
        console.error('Error processing STK push:', error);
        // Send a detailed error message to the client for debugging
        res.status(500).json({ success: false, error: error.message || 'Internal server error.' });
    }
});
// --- End STK Push API Endpoint ---

// --- Payment Confirmation Endpoint (Webhook) ---
app.post('/api/mpesa/callback', (req, res) => {
    console.log('Webhook received:', req.body);
    // IMPORTANT: Always send a 200 OK response to acknowledge receipt.
    res.status(200).send('OK');
});

// --- Frontend Route ---
// Serve the HTML file. Assumes your HTML file is named 'index.html' and is in the same directory.
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
