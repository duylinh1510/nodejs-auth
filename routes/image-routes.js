const express = require('express');
const {authMiddleware} = require('../middleware/auth-middleware');
const adminMiddleware = require('../middleware/admin-middlware');
const uploadMiddleware = require('../middleware/upload-middleware');
const {uploadImageController, fetchImageController, deleteImage} = require('../controllers/image-controller');

const router = express.Router();

//upload the image
router.post('/upload', authMiddleware, adminMiddleware, uploadMiddleware.single('image'), uploadImageController);

//get all images
router.get('/get', authMiddleware, fetchImageController);

//delete image
router.delete('/:id', authMiddleware, adminMiddleware, deleteImage);

//to get all the images

module.exports = router;