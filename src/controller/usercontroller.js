import bcrypt from 'bcryptjs';
import { pool } from '../DatabaseConnection/postgresConnections.js';
import ResponseHandler from '../helpers/responseHandler.js';
import { generateToken } from '../utils/jwtToken.js';

const UserController = {};

UserController.registerUser = async (req, res) => {
    try {
        let userSignInDetails = req.body;

        console.log("User Sign In Details : ", userSignInDetails);

        if (!userSignInDetails.name || !userSignInDetails.email || !userSignInDetails.phone_no || !userSignInDetails.password) {
            ResponseHandler.error(res, "Please provide all the details", 400);
            return;
        }   

        let whereClause = [];
        let params = [];

        if(userSignInDetails.email){
            whereClause.push(`email = $1`)
            params.push(userSignInDetails.email);
        }
        if(userSignInDetails.phone_no){
            whereClause.push(`phone_no = $2`)
            params.push(userSignInDetails.phone_no);
        }

        let userExist = await pool.query(`SELECT id FROM users WHERE ${whereClause.join(' OR ')}`, params);

        if (userExist.rows.length > 0) {
            return ResponseHandler.error(res, "User already exist", 400);
        }

        let hashedPassword = bcrypt.hashSync(userSignInDetails.password, 10);

        await pool.query('INSERT INTO users (name,email,phone_no,password) VALUES ($1,$2,$3,$4)', [userSignInDetails.name, userSignInDetails.email, userSignInDetails.phone_no, hashedPassword]);

        return ResponseHandler.success(res, "User signed In Successfully!", {});
    }
    catch (error) {
        console.log("Error in UserSign Up API : ", error);
        return ResponseHandler.error(res, "Error in UserSign Up API", 500);
    }
}

UserController.loginUser = async (req, res) => {
    try {
        let userDetails = req.body;
        console.log("User Details : ", userDetails);

        if (!userDetails.user || !userDetails.password) {
            return ResponseHandler.error(res, "Please provide email and password", 400);
        }

        let whereClause = [];
        let params = [];

        if(userDetails.user && userDetails.user.includes('@')){
            whereClause.push(`email = $1`);
            params.push(userDetails.user);
        }
        else if(userDetails.user && !userDetails.user.includes('@')){
            console.log("qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq");
            whereClause.push(`phone_no = $1`);
            params.push(userDetails.user);
        }
        else{
            return ResponseHandler.error(res,"Please provide valid email or phone number",400);
        }

        let userExist = await pool.query(`SELECT id,email,password from users WHERE ${whereClause.join(' OR ')}`, params);

        if (!userExist.rows[0]) {
            ResponseHandler.error(res, "User not found", 404);
            return;
        }

        let passwordCheck = bcrypt.compareSync(userDetails.password, userExist.rows[0].password);

        if (!passwordCheck) {
            ResponseHandler.error(res, "Invalid password", 401);
        }

        let token = generateToken(userExist.rows[0]);

        ResponseHandler.success(res, "User logged In Successfully ! ", {
            user: userExist.rows[0],
            token
        });


    }
    catch (error) {
        console.log("Error in User Login API : ", error);

    }
}

export default UserController;
