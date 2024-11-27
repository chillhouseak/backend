import {Router} from "express";
import { upload } from "../middlewares/multer.middleware.js"; // Path to your multer config
import { registeruser } from "../controllers/user.controller.js"; // Path to your controller

const router = Router();

// Apply multer middleware to handle avatar and cover image uploads
router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverimage", maxCount: 1 }
  ]),
  registeruser
);

export default router;
