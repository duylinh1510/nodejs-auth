const express = require('express');
const {loginUser, registerUser, changePassword} = require('../controllers/auth-controller');
const router = express.Router();
const {authMiddleware} = require("../middleware/auth-middleware");

//all routes related to authentication & authorization
router.post('/register', registerUser);
router.post('/login', loginUser);
console.log("=== KIỂM TRA IMPORT ===");
console.log("authMiddleware có phải function không?:", typeof authMiddleware);
console.log("changePassword có phải function không?:", typeof changePassword);
console.log("=======================");
router.post('/change-password', authMiddleware, changePassword);


module.exports = router;