const axios = require("axios");
const moment = require("moment");

const getAccessToken = async () => {
  const url = " https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
  const auth = Buffer.from(`${process.env.DARAJA_CONSUMER_KEY}:${process.env.DARAJA_CONSUMER_SECRET}`).toString("base64");

  const res = await axios.get(url, {
    headers: { Authorization: `Basic ${auth}` },
  });

  return res.data.access_token;
};

const initiateStkPush = async (phone, amount) => {
  const token = await getAccessToken();
  const timestamp = moment().format("YYYYMMDDHHmmss");

  const password = Buffer.from(`${process.env.DARAJA_SHORTCODE}${process.env.DARAJA_PASSKEY}${timestamp}`).toString("base64");

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
    AccountReference: "MyDairi",
    TransactionDesc: "Diary Payment",
  };

  const res = await axios.post("https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest", payload, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return res.data;
};

module.exports = { initiateStkPush };
