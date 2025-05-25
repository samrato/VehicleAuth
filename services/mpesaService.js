require('dotenv').config();
const axios = require("axios");
const moment = require("moment");

const getAccessToken = async () => {
  const url = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
  const auth = Buffer.from(`${process.env.DARAJA_CONSUMER_KEY}:${process.env.DARAJA_CONSUMER_SECRET}`).toString("base64");

  try {
    const res = await axios.get(url, {
      headers: { Authorization: `Basic ${auth}` },
    });
    return res.data.access_token;
  } catch (error) {
    console.error("Error fetching access token:", error.response?.data || error.message);
    throw error;
  }
};

const initiateStkPush = async (phone, amount) => {
  try {
    // Validate phone format: must start with 254 and be 12 digits
    if (!/^254\d{9}$/.test(phone)) {
      throw new Error("Phone number must be in format 2547XXXXXXXX");
    }

    const token = await getAccessToken();
    const timestamp = moment().format("YYYYMMDDHHmmss");

    // Use correct sandbox passkey or from env
    const passkey = process.env.DARAJA_PASSKEY || "bfb279f9aa9bdbcf158e97dd71a467cd2ca2d7c";
    const password = Buffer.from(`${process.env.DARAJA_SHORTCODE}${passkey}${timestamp}`).toString("base64");

    const payload = {
      BusinessShortCode: process.env.DARAJA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phone,
      PartyB: process.env.DARAJA_SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: process.env.CALLBACK_URL,
      AccountReference: "TECH MASTER",
      TransactionDesc: "Lunch Payment",
    };

    const res = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      payload,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return res.data;
  } catch (error) {
    if (error.response) {
      console.error("STK Push Error Response Data:", error.response.data);
      console.error("Status:", error.response.status);
      console.error("Headers:", error.response.headers);
    } else {
      console.error("STK Push Error:", error.message);
    }
    throw error;
  }
};

module.exports = { initiateStkPush };
