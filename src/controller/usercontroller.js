

const UserController = {};

UserController.signUp = async (req, res) => {
    try {
        let userSignInDetails = req.body;

        console.log("User Sign In Details : ", userSignInDetails);

        if (!userSignInDetails.name || !userSignInDetails.email || !userSignInDetails.phone_no || !userSignInDetails.password) {
            ResponseHandler.error(res, "Please provide all the details", 400);
            return;
        }

        let userExist = await Pool.query('SELECT id FROM users WHERE email = $1', [userSignInDetails.email]);

        if (userExist) {
            ResponseHandler.error(res, "User already exist", 400);
            return;
        }

        let hashedPassword = bcrypt.hashSync(userSignInDetails.password, 10);

        await Pool.query('INSERT INTO users (name,email,phone_no,password) VALUES ($1,$2,$3,$4)', [userSignInDetails.name, userSignInDetails.email, userSignInDetails.phone_no, hashedPassword]);

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

        if (!userDetails.email || !userDetails.password) {
            ResponseHandler.error(res, "Please provide email and password", 400);
            return;
        }

        let userExist = await Pool.query('SELECT id,email,password from users WHERE email = $1', [userDetails.email]);

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
