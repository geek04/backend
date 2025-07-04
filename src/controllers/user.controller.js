import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';

import {User} from '../models/user.model.js';

import { uploadOnCloudinary } from '../utils/claudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Token error →", error);  // 👈 LOG ERROR TO CONSOLE
    throw new ApiError(500, "Something went wrong while generating tokens");
  }
};
  
const registerUser=asyncHandler( async(req,res)=> {
    //get user details from request body
    //validation- not empty
    //check if user already exists
    //check for images,check for avatar
    //upload them to cloudinary, avatar
    //create user object- create entry in database
    //remove password and refresh token from response
    //check for user creation
    //return response
    const {fullName,email,username,password}= req.body
    // console.log("email: ",email);
    if([fullName,email,username,password].some((field) => field?.trim()===' ')
    ){
       throw new ApiError(400,"All fields are required")
  }

  const existedUser = await User.findOne({
    $or : [{username},{email}]
  })

  if(existedUser){
    throw new ApiError(409,"User already exists with email or username")
  }
   // console.log("req.files: ",req.files);

   const avatarLocalPath =req.files?.avatar[0]?.path;
   // const coverLocalPath =req.files?.coverImage[0]?.path;

   let coverLocalPath;
   if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length >0){
    coverLocalPath=req.files.coverImage[0].path;
   }

   if(!avatarLocalPath){
    throw new ApiError(400,"Avatar image is required")
   }

   const avatar=await uploadOnCloudinary(avatarLocalPath)
   const coverImage =await uploadOnCloudinary(coverLocalPath)
   if(!avatar){
    throw new ApiError(500,"Avatar image upload failed")
   }
   const user= await User.create({
    fullName,
    avatar: avatar.url,
    coverImage:coverImage?.url||"",
    email,
    password,
    username:username.toLowerCase(),
   })
   const createdUser = await User.findById(user._id).select("-password -refreshToken");


   if(!createdUser){
    throw new ApiError(500,"User creation failed")
   }    
   return res.status(201).json(
    new ApiResponse( 
       
       200,createdUser,"User created successfully"
        
    )  
   )    

})  


const loginUser= asyncHandler(async(req,res)=>{
    //get user details from request body
    //validation- not empty(username/email )
    //check if user exists
    //check for password match
    //create access token and refresh token
    //return response with tokens and user details
    const {email,username,password}=req.body
    if (!(username?.trim() || email?.trim())) {
  throw new ApiError(400, "Username or email is required");
}
  
  const user = await User.findOne({
    $or : [{username},{email}]
  })

  if(!user){
    throw new ApiError(404,"User not found")
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if(!isPasswordValid){
    throw new ApiError(401,"Invalid credentials")
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
  const options={
    httpOnly: true,
    secure: true // Set secure flag in production
  }

  return res.status(200)
  .status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken, options)
  .json(
    new ApiResponse(
      200,
      { //data to be sent in response
        user: loggedInUser,
        
        accessToken,
        refreshToken,
      },
      "User Login successful"
    )
  )
})

const loggedoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    { 
      $set: {
        refreshToken: undefined
      }
    },
    { 
      new: true
    }
  )
  const options={
    httpOnly: true,
    secure: true // Set secure flag in production
  }
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
      new ApiResponse(
        200,
        null,
        "User logged out successfully"
      )
    );

})


const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken
  
  
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is required for authentication")
  }
  
  
  try {
    const decoded=jwt.verify(
      incomingRefreshToken, 
      process.env.REFRESH_TOKEN_SECRET
    )
  
    const user = await User.findById(decoded?._id)
    if(!user){
      throw new ApiError(401, "Invalid refresh token")
    }
    if(user?.refreshToken !== incomingRefreshToken){
      throw new ApiError(401, "Refresh token is expired or used")
    }
    const options ={
      httpOnly: true,
      secure: true // Set secure flag in production
    }
    const {accessToken,newRefreshToken}= await generateAccessAndRefreshTokens(user._id)
  
    return res
      .status(200)
      .cookie("accessToken", accessToken,options)
      .cookie("refreshToken", newRefreshToken,options)   
      .json(
        new ApiResponse(
          200,
          { 
            accessToken: accessToken,
            refreshToken: newRefreshToken
          },
          "Access token refreshed successfully"
        )
      )
  }catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token")
  }
})

const changeCurrentPassword= asyncHandler(async (req,res)=>{
  const{oldPassword,newPassword}=req.body

  const user= await User.findById(req.user?._id)
  const isPasswordCorrect= await user.isPasswordCorrect(oldPassword)

  if(!isPasswordCorrect){
    throw new ApiError(401,"Inalid old password")
  }
  user.password=newPassword
  await user.save({validateBeforeSave: false})
  return res
  .status(200)
  .json
  (
    new ApiResponse(200,{},"Password changed successfully")
  )

})

const getCurrentUser = asyncHandler(async(req,res)=>{
  return res
  .status(200)
  .json(
    new ApiResponse(200,request.user, "Current user details retrieved successfully")
  )
})

const updateAccountDetails= asyncHandler(async(req,res)=>{
  const {fullName,email}=req.body
  if(!fullName?.trim() || !email?.trim()){
    throw new ApiError(400,"Full name and email are required")
  }
  const user= await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        fullName,
        email
      }
    },
    {new: true}
  ).select("-password -refreshToken")

  return res
  .status(200)
  .json(
    new ApiResponse(200,user, "User details updated successfully")
  )
})

const updateUserAvatar= asyncHandler(async(req,res)=>{
  const avatarLocalPath= req.file?.path 

  if(!avatarLocalPath){
    throw new ApiError(400,"Avatar image is required")
  }
  const avatar= await uploadOnCloudinary(avatarLocalPath)

  if(!avatar.url){
    throw new ApiError(400,"Error uploading avatar image")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        avatar: avatar.url
      }
    },
    {new: true}
  ).select("-password -refreshToken")

  return res
  .status(200)
  .json(
    new ApiResponse(200,user, "User avatar updated successfully")
  )
})

const updateUserCoverImage= asyncHandler(async(req,res)=>{
  const CoverImageLocalPath= req.file?.path 

  if(!CoverImageLocalPath){
    throw new ApiError(400,"Cover image is required")
  }
  const CoverImage= await uploadOnCloudinary(CoverImageLocalPath)

  if(!CoverImage.url){
    throw new ApiError(400,"Error uploading Cover image")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        CoverImage: CoverImage.url
      }
    },
    {new: true}
  ).select("-password -refreshToken")

  return res
  .status(200)
  .json(
    new ApiResponse(200,user, "User cover image updated successfully")
  )
})

export {
  registerUser,
  loginUser,
  loggedoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage
};