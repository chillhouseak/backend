import {Router} from "express";
import { upload } from "../middlewares/multer.middleware.js"; // Path to your multer config
import {loginuser,logoutuser, refreshaccesstoken,registeruser } from "../controllers/user.controller.js"; // Path to your controller
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router();

// Apply multer middleware to handle avatar and cover image uploads
router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverimage", maxCount: 1 }
  ]),
  registeruser
)

router.route("/login").post(loginuser)
router.route("/logout").post(verifyJWT,logoutuser)
router.route("/refresh-token").post(refreshaccesstoken)
export default router;
