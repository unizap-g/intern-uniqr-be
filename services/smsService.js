// services/smsService.js
import axios from 'axios';

export const sendOtpSms = async (mobileNumber, otp) => {
  // 1. Retrieve all necessary credentials from the .env file
  const apiUrl = process.env.SMS_API_URL;
  const authKey = process.env.SMS_AUTH_KEY;
  const templateId = process.env.SMS_TEMPLATE_ID;
  const appHash = process.env.SMS_HELLO_APP_HASH;
  const phpSessId = process.env.SMS_PHPSESSID || ''; // Default to an empty string if not set

  // 2. Construct the data payload (the body of the request)
  // This structure precisely matches your cURL command's --data flag.
  const payload = {
    template_id: templateId,
    recipients: [
      {
        mobiles: mobileNumber,
        "number": otp
      }
    ]
  };

  // 3. Construct the headers, with the new Cookie format
  // This now perfectly mirrors your cURL --header flags.
  const headers = {
    'Accept': 'application/json',
    'authkey': authKey,
    'Content-Type': 'application/json',
    // VITAL CHANGE: Construct the Cookie header string exactly as specified.
    'Cookie': `HELLO_APP_HASH=${appHash}; PHPSESSID=${phpSessId}`
  };

  try {
    // 4. Make the real API call using axios
    console.log(`Sending real SMS to ${mobileNumber} with custom Cookie header...`);
    const response = await axios.post(apiUrl, payload, { headers });
    
    console.log('SMS sent successfully. Gateway Response:', response.data);
    return true; // Indicate success

  } catch (error) {
    // 5. Provide detailed error logging for easy debugging
    console.error('❌ Error sending SMS via custom gateway:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error Message:', error.message);
    }
    return false; // Indicate failure
  }
};