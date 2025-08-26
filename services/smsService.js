// services/smsService.js
import axios from 'axios';

/**
 * Sends an OTP using a specific API structure that requires a Cookie header.
 * @param {string} fullMobileNumber - The recipient's full mobile number, including country code.
 * @param {string} otp - The 6-digit One-Time Password.
 * @returns {Promise<boolean>} - True if the SMS was sent successfully, false otherwise.
 */
export const sendOtpSms = async (fullMobileNumber, otp) => {

  // --- Development & QA Safe Mode ---
  // If the environment is not 'production', simulate the SMS to avoid costs.
  // if (process.env.NODE_ENV !== 'production') {
  //   console.log('----------------------------------------------------');
  //   console.log(`[DEVELOPMENT SMS SIMULATION]`);
  //   console.log(`  Recipient: ${fullMobileNumber}`);
  //   console.log(`  OTP Code: ${otp}`);
  //   console.log(`  (This would have used the custom Cookie header in production)`);
  //   console.log('----------------------------------------------------');
  //   return true; // Simulate a successful send
  // }

  // --- Production Logic ---
  try {
    // 1. Retrieve all necessary credentials from the .env file
    const apiUrl = process.env.SMS_API_URL;
    const authKey = process.env.SMS_AUTH_KEY;
    const templateId = process.env.SMS_TEMPLATE_ID;
    const appHash = process.env.SMS_HELLO_APP_HASH;
    const phpSessId = process.env.SMS_PHPSESSID || ''; // Default to an empty string if not set

    // 2. Construct the data payload (the body of the request)
    // This structure is preserved exactly as you provided it.
    const payload = {
      template_id: templateId,
      recipients: [
        {
          // The function now correctly uses the full mobile number.
          mobiles: fullMobileNumber,
          "number": otp
        }
      ]
    };

    // 3. Construct the headers, with the Cookie format
    // This structure is preserved exactly as you provided it.
    const headers = {
      'Accept': 'application/json',
      'authkey': authKey,
      'Content-Type': 'application/json',
      'Cookie': `HELLO_APP_HASH=${appHash}; PHPSESSID=${phpSessId}`
    };

    // 4. Make the real API call using axios
    console.log(`Sending production SMS to ${fullMobileNumber} with custom Cookie header...`);
    const response = await axios.post(apiUrl, payload, { headers });
    
    console.log('Production SMS sent successfully. Gateway Response:', response.data);
    return true;

  } catch (error) {
    // 5. Provide detailed error logging for easy debugging
    console.error('❌ CRITICAL: Failed to send production SMS via gateway:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error Message:', error.message);
    }
    return false;
  }
};