import { asynchandler } from "../utils/asynchandler.js";
import {apiError} from "../utils/apierror.js";
import {User} from "../models/user.models.js";
import {uploadcloudinary} from "../utils/cloudinary.js"
import {apiresponce} from "../utils/apiresponce.js"
import jwt from "jsonwebtoken";


const generateAccessandRefreshTokens =async(userId)=>{
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()
    user.refreshToken = refreshToken
   await user.save({validateBeforeSave: false})
   return accessToken, refreshToken
  } catch (error) {
    throw new apiError (500 , "something went wrong while generating access and refresh token")
  }
}

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

const loginuser = asynchandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!username && !email) {
    throw new apiError(400, "Username or email is required");
  }

  const user = await User.findOne({
    $or: [{ email }, { username }],
  });

  if(!user){
    throw new apiError( 400 ,"user  not found")
  }
  const isPasswordValid = await user.isPasswordCorrect(password)

  if(!isPasswordValid){
    throw new apiError (401, "invalid user credentials")
  }

  const {accessToken , refreshToken} = await generateAccessandRefreshTokens(user._id)

  const loggedInUser = await User.findById(User._id).select("-password -refreshToken")

  const option = {
    httpOnly: true,
    secure: true,
  }
return res
.status(200)
.cookie("accessToken",accessToken,option)
.cookie("refreshToken", refreshToken , option)
.json(
  new apiresponce(
    200,{
      user: loggedInUser, refreshToken, accessToken
    },
    "user loggedin succesfully"
  )
)
})

const logoutuser = asynchandler(async(req, res)=>{
  await User.findByIdAndUpdate(
    req.user._id,{
      $set:{
        refreshToken: undefined
      }
    },
    {
      new: true
    }
  )
  const option = {
    httpOnly: true,
    secure: true,
  }
  return res
  .status(200)
  .clearCookie("accessToken",option)
  .clearCookie("refreshToken",option)
  .json(new apiresponce(200,{},"user loggedoutsccuessfully"))
  
})
const refreshaccesstoken =asynchandler(async(req,res)=>{
 const incomingrefreshtoken= req.cookies.refreshToken || req.body.refreshToken
 if (incomingrefreshtoken) {
  throw new apiError(401,"unauthorized request")
 }
 try {
  const decodedtoken = jwt.verify(
   incomingrefreshtoken,
   process.env.REFRESH_TOKEN_SECRET
 )
  const user = await User.findById(decodedtoken?._id)
  if(!user){
   throw new apiError(401, "invalid refresh token")
  }
  if (incomingrefreshtoken !==user?.refreshToken) {
   throw new apiError(401, "refresh token is expired or used")
   const option={
     httpOnly: true,
     secure: true
   }
   const {accessToken,newrefreshToken} =await generateAccessandRefreshTokens(user._id)
   return res
   .status(200)
   .cookie("accessToken",accessToken,option)
   .cookie("refreshToken",newrefreshToken , option)
   .json(
     new apiresponce(
       200,
       {accessToken,refreshToken: newrefreshToken},
       "access token"
     )
   )
  }
 } catch (error) {
  throw new ApiError(401, error?.message || "Invalid refresh token")
 }
})

export {
  registeruser,
  loginuser,
  logoutuser,
  refreshaccesstoken
}