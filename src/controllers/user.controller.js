import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/apiError.js';

import {User} from '../models/user.model.js';

import { uploadOnCloudinary } from '../utils/claudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user= await User.findById(userId)
    const accessToken=user.generateAccessToken()
    const refeshToken=user.generateRefreshToken()

    user.refreshToken=refeshToken
    await user.save({validateBeforeSave: false})

    return{ accessToken,refreshToken}

  }catch(error){
    throw new ApiError(500, "Something went wrong while generating tokens");
  }
}
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
    if(!username || !email){
      throw new ApiError(400,"Username or email is required")
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
        user: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          username: user.username,
          avatar: user.avatar,
          coverImage: user.coverImage,
        },
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
export {
  registerUser,
  loginUser,
  loggedoutUser
    }