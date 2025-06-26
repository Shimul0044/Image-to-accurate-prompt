// server.js (সংশোধিত এবং সঠিক ভার্সন)

const express = require('express');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- স্থায়ী লাইসেন্স ডেটাবেস (Hardcoded) ---
// সার্ভার রিস্টার্ট হলেও এই ডেটা মুছে যাবে না।
// নতুন লাইসেন্স কী যোগ করতে হলে, এখানেই যোগ করে কোডটি আবার ডেপ্লয় করতে হবে।
// এটিই আপনার জন্য সবচেয়ে সহজ এবং নির্ভরযোগ্য সমাধান।
const licenses = {
  "EXAMPLE-KEY-12345": { duration_days: 30, activated_on: null, device_id: null },
  "ANOTHER-KEY-ABCDE": { duration_days: 90, activated_on: null, device_id: null },
  "SPECIAL-USER-KEY-XYZ": { duration_days: 365, activated_on: null, device_id: null }
};


// --- লাইসেন্স অ্যাক্টিভেশন এন্ডপয়েন্ট ---
// আপনার ক্রোম এক্সটেনশন এই URL (`/api/activate`) এ কল করবে।
app.post('/api/activate', (req, res) => {
    const { licenseKey, deviceId } = req.body;

    // ১. প্রয়োজনীয় তথ্য (licenseKey, deviceId) পাঠানো হয়েছে কিনা তা যাচাই করুন।
    if (!licenseKey || !deviceId) {
        return res.status(400).json({ message: 'License key and device ID are required.' });
    }

    // ২. লাইসেন্স কী আমাদের তালিকায় আছে কিনা তা দেখুন।
    const licenseData = licenses[licenseKey];
    if (!licenseData) {
        return res.status(404).json({ message: 'License key not found or invalid.' });
    }

    // ৩. লাইসেন্সটি আগে থেকেই অন্য কোনো ডিভাইসে অ্যাক্টিভেট করা আছে কিনা দেখুন।
    if (licenseData.device_id && licenseData.device_id !== deviceId) {
        return res.status(403).json({ message: 'This license key is already in use on another device.' });
    }

    // ৪. যদি লাইসেন্সটি আগে অ্যাক্টিভেট না হয়ে থাকে, তাহলে অ্যাক্টিভেট করুন।
    if (!licenseData.activated_on) {
        licenseData.activated_on = new Date().toISOString();
        licenseData.device_id = deviceId;
        console.log(`License ${licenseKey} activated for the first time on device ${deviceId}.`);
    }

    // ৫. লাইসেন্সের মেয়াদ কবে শেষ হবে তা গণনা করুন।
    const activationDate = new Date(licenseData.activated_on);
    const expiresOn = new Date(activationDate);
    expiresOn.setDate(activationDate.getDate() + licenseData.duration_days);

    // ৬. লাইসেন্সের মেয়াদ শেষ হয়ে গেছে কিনা যাচাই করুন।
    if (new Date() > expiresOn) {
        return res.status(403).json({ message: 'This license has expired.' });
    }
    
    // ৭. সফলভাবে অ্যাক্টিভেট হলে এক্সটেনশনকে সঠিক তথ্য পাঠান।
    console.log(`License ${licenseKey} validated successfully for device ${deviceId}.`);
    res.status(200).json({
        message: 'License activated successfully!',
        licenseKey: licenseKey,
        expiresOn: expiresOn.toISOString()
    });
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});