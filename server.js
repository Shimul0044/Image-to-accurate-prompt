// server.js (Final Updated Version)

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// <<< NEW >>> অ্যাডমিন এন্ডপয়েন্টের নিরাপত্তার জন্য একটি গোপন কী
// !!! এই কী টি অবশ্যই পরিবর্তন করে একটি কঠিন এবং গোপন কী দিন !!!
const ADMIN_API_KEY = '27168'; 

app.use(cors());
app.use(express.json());

// --- লাইসেন্স ডাটাবেস ---
const licenses = {
    "XAMPLE-KEY-123456": { duration_days: 1, activated_on: null, device_id: null },
    "trial-dhfurgf5-7f7g87f8": { duration_days: 7, activated_on: null, device_id: null },
    "trial-ed56ftf-78393rh": { duration_days: 3, activated_on: null, device_id: null },
    "trial-edft5gtf-i4982r": { duration_days: 3, activated_on: null, device_id: null },
    "5j00yWEBBUJI8RF3JJ3YH": { duration_days: 1, activated_on: null, device_id: null },
};


// --- License Activation Endpoint (No changes needed here) ---
app.post('/api/activate', (req, res) => {
    const { licenseKey, deviceId } = req.body;
    if (!licenseKey || !deviceId) {
        return res.status(400).json({ message: 'License key and device ID are required.' });
    }
    const licenseData = licenses[licenseKey];
    if (!licenseData) {
        return res.status(404).json({ message: 'License key not found or invalid.' });
    }
    if (licenseData.device_id && licenseData.device_id !== deviceId) {
        return res.status(403).json({ message: 'This license key is already in use on another device.' });
    }
    if (licenseData.activated_on) {
        const activationDate = new Date(licenseData.activated_on);
        const expiresOn = new Date(activationDate.getTime() + (licenseData.duration_days * 24 * 60 * 60 * 1000));
        if (new Date() > expiresOn) {
            return res.status(403).json({ message: 'This license has already expired.' });
        }
    }
    if (!licenseData.device_id) {
        licenseData.device_id = deviceId;
        licenseData.activated_on = new Date().toISOString();
    }
    const finalActivationDate = new Date(licenseData.activated_on);
    const finalExpiresOn = new Date(finalActivationDate.getTime() + (licenseData.duration_days * 24 * 60 * 60 * 1000));
    res.status(200).json({
        message: 'License activated successfully!',
        licenseKey: licenseKey,
        expiresOn: finalExpiresOn.toISOString()
    });
});

// <<< NEW ENDPOINT 1 >>> সকল লাইসেন্সের অবস্থা দেখার জন্য
app.get('/api/status', (req, res) => {
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== ADMIN_API_KEY) {
        return res.status(401).json({ message: 'Unauthorized: Admin API key is missing or incorrect.' });
    }
    res.status(200).json(licenses);
});

// <<< NEW ENDPOINT 2 >>> নির্দিষ্ট কী ডিঅ্যাক্টিভেট করার জন্য
app.post('/api/deactivate', (req, res) => {
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== ADMIN_API_KEY) {
        return res.status(401).json({ message: 'Unauthorized: Admin API key is missing or incorrect.' });
    }

    const { licenseKey } = req.body;
    if (!licenseKey) {
        return res.status(400).json({ message: 'License key is required to deactivate.' });
    }

    const licenseData = licenses[licenseKey];
    if (!licenseData) {
        return res.status(404).json({ message: 'License key not found.' });
    }

    // লাইসেন্স রিসেট করুন
    licenseData.activated_on = null;
    licenseData.device_id = null;

    console.log(`License ${licenseKey} has been deactivated by an admin.`);
    res.status(200).json({ message: `License ${licenseKey} has been successfully deactivated.` });
});

// <<< NEW ENDPOINT 3 >>> এক্সটেনশন থেকে নিয়মিত যাচাই করার জন্য
app.post('/api/validate', (req, res) => {
    const { licenseKey, deviceId } = req.body;
    if (!licenseKey || !deviceId) {
        return res.status(200).json({ valid: false, message: 'Missing information.' });
    }

    const licenseData = licenses[licenseKey];
    if (!licenseData || licenseData.device_id !== deviceId || !licenseData.activated_on) {
        // যদি কী না থাকে, বা ডিভাইস আইডি না মেলে, বা কী কখনো অ্যাক্টিভেট-ই না হয়ে থাকে
        return res.status(200).json({ valid: false, message: 'Invalid or deactivated license.' });
    }

    // মেয়াদ শেষ হয়েছে কি না চেক করুন
    const activationDate = new Date(licenseData.activated_on);
    const expiresOn = new Date(activationDate.getTime() + (licenseData.duration_days * 24 * 60 * 60 * 1000));
    if (new Date() > expiresOn) {
        return res.status(200).json({ valid: false, message: 'License expired.' });
    }

    // সব ঠিক থাকলে
    return res.status(200).json({ valid: true });
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});