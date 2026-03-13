const Image = require('../models/Image');
const {uploadToCloudinary} = require('../helpers/cloudinaryHelper');
const fs = require('fs');
const cloudinary = require("../config/cloudinary");

const uploadImageController = async(req,res)=>{
    try {
        //check if file is missing in req object
        if(!req.file){
            return res.status(400).json({
                success : false,
                message : "File is required. Please upload an image!"
            })
        }

        //upload to cloudinary
        const {url, publicId} = await uploadToCloudinary(req.file.path);

        //store the image url and publicId along with the uploaded user id in database
        const newlyUploadedImage = new Image({
            url,
            publicId,
            uploadedBy : req.userInfo.userId
        });

        await newlyUploadedImage.save();

        //delete the file from local storage
        fs.unlinkSync(req.file.path);

        res.status(201).json({
            success : true,
            message : "Image uploaded successfully!",
            image : newlyUploadedImage
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success : false,
            message : "Something went wrong! Please try again."
        })
    }
};

const fetchImageController = async(req,res)=>{
    try {
        const page = parseInt(req.query.page) || 1; // lấy số thứ tự của page mà client request (khi gọi API), nếu không có thì mặc định là Page 1
        const limit = parseInt(req.query.limit) || 5; //lấy số lượng ảnh mà client request, nếu không có thì mặc định là 5
        const skip = (page - 1) * limit; //images need to skip when in the current page

        const sortBy = req.query.sortBy || 'createdAt'; //arrage images
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;


        // 1. Tạo object query để lọc đúng ảnh của user đang đăng nhập
        const currentUserId = req.userInfo.userId;
        const query = {uploadedBy: currentUserId};

        // 2. Phải truyền query vào countDocuments để đếm tổng số ảnh CỦA RIÊNG USER NÀY
        const totalImages = await Image.countDocuments(query);

        // Lấy tổng số ảnh chia cho limit (12 / 5 = 2.4). 
        // Nhưng số trang thì không thể là số thập phân được, nên bạn phải dùng Math.ceil() để làm tròn lên 3. 
        // Nghĩa là cần 3 trang để chứa hết 12 tấm ảnh này (Trang 1: 5 ảnh, Trang 2: 5 ảnh, Trang 3: 2 ảnh).
        const totalPages = Math.ceil(totalImages/limit);


        const sortObj = {};
        sortObj[sortBy] = sortOrder;

        // Đây là chuỗi lệnh thực thi (pipeline). Mongoose sẽ làm theo thứ tự sau:
        // find(query): Lọc ra toàn bộ ảnh của đúng User này.
        // sort(sortObj): Sắp xếp đống ảnh đó theo thời gian (ví dụ: mới nhất lên đầu).
        // skip(skip): Chặt bỏ phần đầu (những ảnh thuộc về các trang trước).
        // limit(limit): Cắt đúng 5 ảnh tiếp theo để mang về báo cáo cho bạn.
        const images = await Image.find(query).sort(sortObj).skip(skip).limit(limit);

        if(images){
            res.status(200).json({
                success : true,
                currentPage: page,
                totalPages: totalPages,
                totalImages: totalImages,
                data : images
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success : false,
            message : "Something went wrong! Please try again."
        });
    }
}

const deleteImage = async(req, res) => {
    try {
        const getCurrentIdOfImageToBeDeleted = req.params.id;
        const userId = req.userInfo.userId;

        const image = await Image.findById(getCurrentIdOfImageToBeDeleted);
        if(!image){
            return res.status(404).json({
                success: false,
                message: "Image not found!"
            });
        }

        //check if the image is uploaded by current user who is trying to delete this image
        if(image.uploadedBy.toString() !== userId){
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this image!"
            })
        }

        //delete this image from Cloudinary storage
        await cloudinary.uploader.destroy(image.publicId);

        //delete the image from MongoDB 
        await Image.findByIdAndDelete(getCurrentIdOfImageToBeDeleted);
        res.status(200).json({
            success: true,
            message: "Image deleted successfully!"
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Something went wrong. Please try again!"
        });
    }
}

module.exports = {
    uploadImageController, fetchImageController, deleteImage
};