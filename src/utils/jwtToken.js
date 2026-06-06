import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const generateToken = (user) => {
    try{
        const token = jwt.sign(
            {id:user.id,email:user.email},
            process.env.JWT_SECRET || "parth",
            {expiresIn:"1h"}
        )   
        return token;
    }
    catch(error){
        console.log("Error in token generation : ",error);
        throw error;
    }
}

const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'] || req.headers['Authorization'];
        if (!authHeader) {
            return res.status(401).json({ success: false, error: "Access denied. No token provided." });
        }

        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
        if (!token) {
            return res.status(401).json({ success: false, error: "Access denied. Invalid token format." });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || "parth");
        req.user = decoded;
        next();
    }
    catch(error){
        console.log("Error in token verification : ",error);
        return res.status(403).json({ success: false, error: "Invalid or expired token." });
    }
}

export {generateToken,verifyToken}