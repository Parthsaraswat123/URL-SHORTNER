import { Router } from "express";
const router = Router();
import UserController from "../controller/usercontroller.js";


router.post('/register',UserController.registerUser);
router.post('/login',UserController.loginUser);


export default router;
