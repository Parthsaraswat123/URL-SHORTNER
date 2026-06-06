import { Router } from "express";
import { verifyToken } from "../utils/jwtToken.js";
import multer from "multer";
import UrlController from "../controller/urlController.js";
import path from "path";
const router = Router();

const __dirname = path.resolve();
const UPLOAD_DIR = path.join(__dirname, 'uploads');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        // Keeps original extension intact
        cb(null,file.originalname);
    }
});

const upload = multer({ storage: storage });

router.post('/create-single-url',verifyToken,UrlController.createSingleUrl);

router.post('/create-bulk-urls',verifyToken,upload.single('file'),UrlController.bulkCreateUrl);

router.get('/:short_url',UrlController.redirectUrl);


export default router;



