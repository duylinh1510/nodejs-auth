const jwt = require('jsonwebtoken');


// req → request từ client
// res → response trả về
// next() → cho phép request đi tiếp đến API tiếp theo
const authMiddleware = (req,res,next)=>{
    const authHeader = req.headers['authorization'];
    console.log(authHeader);
    const token = authHeader && authHeader.split(" ")[1]; //Lấy token từ header 

    if(!token){
        return res.status(401).json({ //401 Unauthorized
            success : false,
            message : "Access denied. No token provided. Please login to continue"
        })
    }
    // jwt.verify() làm 2 việc:
    // 1️⃣ Kiểm tra token có hợp lệ không
    // token có bị sửa không
    // token có đúng secret key không
    // token có hết hạn không
    // 2️⃣ Nếu hợp lệ → giải mã payload
    try {
        const decodedTokenInfo = jwt.verify(token, process.env.JWT_SECRET_KEY);
        console.log(decodedTokenInfo);

        //Gắn user info vào request
        req.userInfo = decodedTokenInfo;
        next();
    } catch (error) {
        return res.status(401).json({
            success : false,
            message : "Invalid or expired token"
        })
    }
}

module.exports = {authMiddleware};