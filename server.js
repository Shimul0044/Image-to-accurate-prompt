// server.js (Final Version with 1 User 1 Key Logic)

const express = require('express');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- Permanent License Database (Hardcoded) ---
const licenses = {
    "XAMPLE-KEY-123456": { duration_days: 1, activated_on: null, device_id: null },
    "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d": { duration_days: 7, activated_on: null, device_id: null },
    "8tgfa7fdf-8c9d-0e1f2a3b4c5d": { duration_days: 365, activated_on: null, device_id: null },
    "trial-5r98f-hyf67": { duration_days: 7, activated_on: null, device_id: null },
    "trial-edftf-frf98f": { duration_days: 7, activated_on: null, device_id: null },
    "trial-dhfurgf5-7f7g87f8": { duration_days: 7, activated_on: null, device_id: null },
};


// --- License Activation Endpoint ---
app.post('/api/activate', (req, res) => {
    const { licenseKey, deviceId } = req.body;

    // 1. Check if required information was sent
    if (!licenseKey || !deviceId) {
        return res.status(400).json({ message: 'License key and device ID are required.' });
    }

    // 2. Check if the license key exists
    const licenseData = licenses[licenseKey];
    if (!licenseData) {
        return res.status(404).json({ message: 'License key not found or invalid.' });
    }
    
    // 3. **THE FIX FOR 1 USER 1 KEY**:
    // Check if the key is already assigned to a device.
    // If it is, check if the incoming deviceId matches the assigned one.
    if (licenseData.device_id && licenseData.device_id !== deviceId) {
        return res.status(403).json({ message: 'This license key is already in use on another device.' });
    }

    // 4. Check if the key was previously activated and has now expired
    if (licenseData.activated_on) {
        const activationDate = new Date(licenseData.activated_on);
        const durationInMillis = licenseData.duration_days * 24 * 60 * 60 * 1000;
        const expiresOn = new Date(activationDate.getTime() + durationInMillis);

        if (new Date() > expiresOn) {
            return res.status(403).json({ message: 'This license has already expired and cannot be reused.' });
        }
    }

    // 5. If the license is new or being used by the same device, set/update details.
    if (!licenseData.device_id) {
        licenseData.device_id = deviceId; // Assign deviceId for the first time
    }
    if (!licenseData.activated_on) {
        licenseData.activated_on = new Date().toISOString(); // Set activation date for the first time
        console.log(`License ${licenseKey} activated for the first time on device ${deviceId}.`);
    }

    // 6. Send the success response to the extension
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