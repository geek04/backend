import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/apiError.js';

import {User} from '../models/user.model.js';

import { uploadOnCloudinary } from '../utils/claudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
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

export {registerUser}