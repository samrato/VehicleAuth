const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
} = require('../controllers/Usercontrollers');

const { stkPushController, callbackController } = require("../controllers/mpseacontroller");


router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);



// the mpesa
router.post("/stkpush", stkPushController);
router.post("/callback", callbackController);
module.exports = router;

