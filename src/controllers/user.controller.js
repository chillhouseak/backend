import { asynchandler } from "../utils/asynchandler.js";
import {apiError} from "../utils/apierror.js";
import {User} from "../models/user.models.js";
import {uploadcloudinary} from "../utils/cloudinary.js"
import {apiresponce} from "../utils/apiresponce.js"

const registeruser = asynchandler( async (req, res)=>{
    
    const {fullname, email,username, password} =req.body
    console.log("email",email)
   if (
    [fullname ,email,username,password].some((field)=>field?.trim() === "")
   ) {
    throw new apiError(400, "all fields are req");
    
   }
   const existeduser = User.findOne({
    $or: [{username},{email}]
   })
   if (existeduser) {
    throw new apiError(409 , "user with email and username already exist")
   }

   const avtarlocalpath = req.files?.avatar[0]?.path;
   const coverimagelocalpath = req.files?.coverimage[0]?.path;

   if (!avtarlocalpath) {
    throw new apiError(400 , "avatr files not found")
    
   }
   const avatar = await uploadcloudinary(avatarlocalpath)
   const coverimage = await uploadcloudinary(coverimagelocalpath)
   if (!avatar) {
     throw new apiError(400 , "avatar file not found")
   }
   const user = User.create({
    fullname,
    avatar: avatar.url,
    coverimage: coverimage?.url ||"",
    email,
    password,
    username: username.toLowerCase()
   })
   const createduser = await User.findById(user._id).select("-password _refreshtoken")
   if (!createduser) {
    throw new apiError(500 , "something went wrong while registering user")
   }

   return res.status(201).json(
    new apiresponce(200,createduser,"user registerd successfully")
   )
})

export {registeruser}