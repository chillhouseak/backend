import { asynchandler } from "../utils/asynchandler.js";
import {apiError} from "../utils/apierror.js";
import {User} from "../models/user.models.js";
import {uploadcloudinary} from "../utils/cloudinary.js"
import {apiresponce} from "../utils/apiresponce.js"

const registeruser = asynchandler( async (req, res)=>{
    
    const { fullname ,email,username, password} =req.body
    console.log("email",email)
   
   
    if (
    [fullname ,email,username,password].some((field)=>field?.trim() === "")
   ) {
    throw new apiError(400, "all fields are req");
    
   }
   const existeduser =  await User.findOne({
    $or: [{username},{email}]
   })
   if (existeduser) {
    throw new apiError(409 , "user with email and username already exist")
   }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    console.log(avatarLocalPath)
    
    const coverimagelocalpath = req.files?.coverimage?.[0]?.path;
    console.log(coverimagelocalpath)
   
    if (!avatarLocalPath) {
    throw new apiError(400 , "avatar path  not found")
    
   }
   const avatar = await uploadcloudinary(avatarLocalPath)
   
   const coverimage = await uploadcloudinary(coverimagelocalpath)
   console.log("coverImage " , coverimage)
   
   if (!avatar) {
     throw new apiError(400 , "avatar file not found")
   }
   
   const user = await User.create({
    fullname,
    avatar: avatar?.url,
    coverimage: coverimage ? coverimage?.url : null,
    email,
    password,
    username: username.toLowerCase()
   })
   
   const createduser = await User.findById(user._id).select("-password -refreshtoken")
   if (!createduser) {
    throw new apiError(500 , "something went wrong while registering user")
   }

   
   return res.status(201).json(
    new apiresponce(200,createduser,"user registerd successfully")
   )
})

export {registeruser}