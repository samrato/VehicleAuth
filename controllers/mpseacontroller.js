
const { initiateStkPush } = require("../services/mpesaService");

const stkPushController = async (req, res) => {
  const { phone, amount } = req.body;

  try {
    if (!phone || !amount) {
      return res.status(400).json({ message: "Phone and amount are required" });
    }

    const result = await initiateStkPush(phone, amount);
    return res.status(200).json(result);
  } catch (error) {
    console.error("STK Push Error:", error.response?.data || error.message);
    return res.status(500).json({ message: "Failed to process STK Push" });
  }
};

const callbackController = async (req, res) => {
  console.log("📥 STK Callback:", JSON.stringify(req.body, null, 2));
  res.status(200).json({ message: "Callback received successfully" });
};

module.exports = { stkPushController, callbackController };
