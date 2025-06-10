require("dotenv").config();
const axios = require("axios");

const sendOtp = async (phone) => {
  try {
    const otpResponse = await axios.get(
      `https://2factor.in/API/V1/${process.env.API_KEY_OTP}/SMS/${phone}/AUTOGEN/${process.env.OTP_TEMPLATE}`
    );
    if (otpResponse.data.Status != "Success") {
      // throw new Error(otpResponse.data.Details);
      return { Status: "Failed", Details: otpResponse.data.Details };
    }
    return otpResponse.data;
  } catch (error) {
    console.error("Error sending OTP:", error.message);
    // throw new Error("Failed to send OTP. Please try again later.");
    return { Status: "Failed", Details: error.message };
  }
};

const verifyOtp = async (otp, phone) => {
  try {
    const otpResponse = await axios.get(
      `https://2factor.in/API/V1/${process.env.API_KEY_OTP}/SMS/VERIFY3/${phone}/${otp}`
    );
    if (otpResponse.data.Status != "Success") {
      // throw new Error(otpResponse.data.Details);
      return { Status: false, Details: otpResponse.data.Details };
    }
    return otpResponse.data;
  } catch (error) {
    console.error("Error verifying OTP:", error.message);
    // throw new Error("Failed to verify OTP. Please try again later.");
    return { Status: false, Details: error.message };
  }
};

module.exports = { sendOtp, verifyOtp };
