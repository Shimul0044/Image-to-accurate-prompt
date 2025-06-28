// server.js (Final Version with 1 User 1 Key Logic)

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
  "f6dhuff-KEY-fd6d9g44sdf6f7y": { duration_days: 7, activated_on: null, device_id: null },
  "fok9iw37r-KEY-fd6d9g44sdf6f7y": { duration_days: 7, activated_on: null, device_id: null },
  "7fher3rudh-KEY-fd6d9g44sdf6f7y": { duration_days: 7, activated_on: null, device_id: null },
  "udejf98qfdd-KEY-fd6d9g44sdf6f7y": { duration_days: 7, activated_on: null, device_id: null },
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