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
   return {accessToken, refreshToken}
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
  console.log(email , username , password)
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
  console.log("accessToken " , accessToken )
  console.log("refreshToken" , refreshToken)
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

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
 if (!incomingrefreshtoken) {
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

   const options={
     httpOnly: true,
     secure: true
   }
   const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
    
   return res
   .status(200)
   .cookie("accessToken", accessToken, options)
   .cookie("refreshToken", newRefreshToken, options)
   .json(
       new apiresponce(
           200, 
           {accessToken, refreshToken: newRefreshToken},
           "Access token refreshed"
       )
   )
}
} catch (error) {
   throw new apiError(401, error?.message || "Invalid refresh token")
}
})

const changecurrentpassword = asynchandler(async(req,res)=>{
  const {oldpassword, newpassword}=req.body

 const user = await User.findById(req.user?._id)
 const isPasswordCorrect= await user.isPasswordCorrect(oldpassword)
 if(!isPasswordCorrect){
  throw new apiError(400,"invalid old password")
 }
 user.password = newpassword
 await user.save({validateBeforeSave: false})
 return res
 .status(200)
 .json(new apiresponce(200,{},"password changes succesfully"))
})

const getcurrentuser = asynchandler(async(req, res)=>{
  return res 
  .status(200)
  .json(200,req.user,"current user fetched succesfully")
})


const updateaccountdetail = asynchandler(async(req, res) => {
  const {fullname, email} = req.body

  if (!fullname || !email) {
      throw new apiError(400, "All fields are required")
  }

  const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
          $set: {
              fullName,
              email
          }
      },
      {new: true}
      
  ).select("-password")

  return res
  .status(200)
  .json(new apiresponce(200, user, "Account details updated successfully"))
});

const updateuseravatar = asynchandler(async(req,res)=>
  {
 const avatarLocalPath = req.file?.path

 if(!avatarLocalPath){
  throw new apiError(400, "avatar file is missing")
 }
 const avatar = await uploadcloudinary(avatarLocalPath)
 if(!avatar.url){
  throw new apiError(400 , "error while uploading avatar")
 }
 const user = await User.findByIdAndUpdate(
  req.user?._id,
  {
    $set:{
      avatar: avatar.url
    },
  },
  {new: true}
 ).select("-password")
 return res
 .status(200)
 .json(
  new apiresponce(200, user, " avatar updated successfully")
 )
});

const updateusercoverimage = asynchandler(async(req,res)=>
  {
 const coverimagelocalpath = req.file?.path

 if(!coverimagelocalpath){
  throw new apiError(400, "avatar file is missing")
 }
 const coverimage = await uploadcloudinary(coverimagelocalpath)
 if(!coverimage.url){
  throw new apiError(400 , "error while uploading coverimage")
 }
 const user = await User.findByIdAndUpdate(
  req.user?._id,
  {
    $set:{
      coverimage: coverimage.url
    },
  },
  {new: true}
 ).select("-password")
 return res
 .status(200)
 .json(
  new apiresponce(200, user, " cover image updated successfully")
 )
});
export {
  registeruser,
  loginuser,
  logoutuser,
  refreshaccesstoken,
  changecurrentpassword,
  getcurrentuser,
 updateaccountdetail,
 updateuseravatar,
 updateusercoverimage
}