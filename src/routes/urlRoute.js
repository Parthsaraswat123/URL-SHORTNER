import express from "express";
import { Router } from "express";
import { verifyToken } from "../utils/jwtToken";
const router = Router();

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

router.post('/create-single-url',verifyToken,controller.createSingleUrl);

router.post('/create-bulk-urls',verifyToken,upload.single('file'),controller.bulkCreateUrl);

router.get('/:short_url',controller.redirectUrl);




