// server.js (Final and Corrected Version)

const express = require('express');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- Permanent License Database (Hardcoded) ---
const licenses = {
  "EXAMPLE-KEY-12345": { duration_days: 30, activated_on: null, device_id: null },
  "siyam-KEY-fd6d9g44sdf6f7y": { duration_days: 7, activated_on: null, device_id: null },
  "rasel-KEY-fd6d9g44sdf6f7y": { duration_days: 7, activated_on: null, device_id: null },
  "razzak-KEY-fd6d9g44sdf6f7y": { duration_days: 7, activated_on: null, device_id: null },
  "utpal-KEY-fd6d9g44sdf6f7y": { duration_days: 7, activated_on: null, device_id: null },
  "bipul-KEY-fd6d9g44sdf6f7y": { duration_days: 7, activated_on: null, device_id: null },
  "ANOTHER-KEY-ABCDE": { duration_days: 90, activated_on: null, device_id: null },
  "SPECIAL-USER-KEY-XYZ": { duration_days: 365, activated_on: null, device_id: null },
  "XAMPLE-KEY-12345": { duration_days: 1, activated_on: null, device_id: null },
};


// --- License Activation Endpoint ---
app.post('/api/activate', (req, res) => {
    const { licenseKey, deviceId } = req.body;

    // 1. Check if required information was sent
    if (!licenseKey || !deviceId) {
        return res.status(400).json({ message: 'License key and device ID are required.' });
    }

    // 2. Check if the license key exists in our list
    const licenseData = licenses[licenseKey];
    if (!licenseData) {
        return res.status(404).json({ message: 'License key not found or invalid.' });
    }

    // 3. **THE FIX**: Check if the key was previously activated and has now expired.
    if (licenseData.activated_on) {
        // Calculate expiration date reliably using milliseconds
        const activationDate = new Date(licenseData.activated_on);
        const durationInMillis = licenseData.duration_days * 24 * 60 * 60 * 1000;
        const expiresOn = new Date(activationDate.getTime() + durationInMillis);

        // If the calculated expiration date has passed, block it immediately.
        if (new Date() > expiresOn) {
            return res.status(403).json({ message: 'This license has already expired and cannot be reused.' });
        }
    }

    // 4. Check if the key is activated on a different device
    if (licenseData.device_id && licenseData.device_id !== deviceId) {
        return res.status(403).json({ message: 'This license key is already in use on another device.' });
    }

    // 5. If the license has never been activated, set the activation details for the first time
    if (!licenseData.activated_on) {
        licenseData.activated_on = new Date().toISOString();
        licenseData.device_id = deviceId;
        console.log(`License ${licenseKey} activated for the first time on device ${deviceId}.`);
    }

    // 6. If all checks pass, send the success response to the extension
    const finalActivationDate = new Date(licenseData.activated_on);
    const finalDurationInMillis = licenseData.duration_days * 24 * 60 * 60 * 1000;
    const finalExpiresOn = new Date(finalActivationDate.getTime() + finalDurationInMillis);

    console.log(`License ${licenseKey} validated successfully for device ${deviceId}.`);
    res.status(200).json({
        message: 'License activated successfully!',
        licenseKey: licenseKey,
        expiresOn: finalExpiresOn.toISOString()
    });
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});