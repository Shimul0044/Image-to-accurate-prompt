// server.js (নতুন এবং সহজ ভার্সন)

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ইন-মেমোরি ডাটাবেস
let licensesDB = [];

// ডেভেলপারদের জন্য: নতুন লাইসেন্স কী তৈরি করার লিংক
app.get('/generate-key', (req, res) => {
    const duration = parseInt(req.query.days) || 30;
    const newKey = `UNLOCK-KEY-${uuidv4().toUpperCase()}`;
    licensesDB.push({ license_key: newKey, duration_days: duration, is_activated: false, device_id: null, activated_on: null });
    console.log(licensesDB);
    res.status(201).json({ message: `New ${duration}-day unlock key generated`, newKey: newKey });
});

// এক্সটেনশনের জন্য: লাইসেন্স কী একটিভেট করার এন্ডপয়েন্ট
app.post('/api/activate', (req, res) => {
    const { licenseKey, deviceId } = req.body;
    if (!licenseKey || !deviceId) return res.status(400).json({ message: 'License key and device ID are required.' });

    const license = licensesDB.find(l => l.license_key === licenseKey);
    if (!license) return res.status(404).json({ message: 'License key not found.' });
    if (license.is_activated && license.device_id !== deviceId) return res.status(403).json({ message: 'This license key is already in use on another device.' });
    if (license.is_activated && license.device_id === deviceId) {
        // যদি একই ডিভাইস আবার একটিভেট করতে চায়, তাহলে শুধু বর্তমান স্ট্যাটাস পাঠিয়ে দিন
    } else {
        license.is_activated = true;
        license.device_id = deviceId;
        license.activated_on = new Date();
    }
    
    const expiresOn = new Date(license.activated_on);
    expiresOn.setDate(expiresOn.getDate() + license.duration_days);

    if (new Date() > expiresOn) return res.status(403).json({ message: 'This license has expired.' });

    res.status(200).json({ message: 'License is valid!', expiresOn: expiresOn, licenseKey: license.license_key });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));