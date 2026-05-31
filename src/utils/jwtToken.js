import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const generateToken = (user) => {
    try{
        const token = jwt.sign(
            {id:user.id,email:user.email},
            process.env.JWT_SECRET,
            {expiresIn:"1h"}
        )   
        return token;
    }
    catch(error){
        console.log("Error in token generation : ",error);
        throw error;
    }
}

const verifyToken = (token) => {
    try{
        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        return decoded;
    }
    catch(error){
        console.log("Error in token verification : ",error);
        throw error;
    }
}

export {generateToken,verifyToken}