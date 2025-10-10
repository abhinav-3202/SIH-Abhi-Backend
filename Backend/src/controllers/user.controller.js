import { asyncHnadler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async(userId)=>{
    try {
        const user = await User.findById(userId)  // this is a object only
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()

        // console.log("accessTokens are :",accessToken)

        user.refreshToken = refreshToken // adding the refresh token to user object 
        await user.save({validateBeforeSave : false})    // save is mongoose model property so while using it mongoose model starts or kick in for example 
                       // password , here it is req: true so it will create problems as password is not provided

        return {accessToken,refreshToken}
    } catch (error) {
        throw new ApiError(500 , " something went wrong while generating access aand refresh tokens")
    }
}

const registerUser = asyncHnadler( async (req,res)=>{
    // get user details from frontend
    // validation - not empty many more 
    // check if user already exist : username/email
    // check for images , soilheathcard (on multer uploaded or not )
    // upload them on cloudinary (multer successfully uploaded or not)
    // create user object -- create entry in db (when entry is done in mongodb everything comes in response)
    // remove password and refresh token field from response 
    // check for user creation 
    // return res 


    const {userName , email , fullName, password , aadhar_no , mobile_no , area_of_land , sex} = req.body
    // console.log("aadhar_no",aadhar_no);

    if (  // after some call back no curly braces because with curly braces we have to expilicitly return  
        [userName , email , fullName, password , aadhar_no , mobile_no , area_of_land , sex].some((field)=>
            field?.trim()==="")    // trim() removes extra spaces from the start and end of a string
    ) {
        throw new ApiError(400,"All fields are required")
    }

    const existedUser =await User.findOne({
        $or:[ { userName } , { email } ]
    })

    if(existedUser){
        throw new ApiError(409 , "user already exist ")
    }
    // console.log(req.files)
    
    // the below two lines of code wont work if there is no values or empty and give error becasue we are not checking whether  
    //  the filepath is present or not , just extracting it ... so it will show error as cannot read properties from undefined
    // better to check from another way  
    // const coverImageLocalPath = req.files?.coverImage[0]?.path     // the files which are brought on our server by multer 
    // const soilHealthCardLocalPath =  req.files?.soilHealthCard[0]?.path 

    let coverImageLocalPath;
    let soilHealthCardLocalPath;

    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(req.files && Array.isArray(req.files.soilHealthCard) && req.files.soilHealthCard.length > 0){
        soilHealthCardLocalPath = req.files.soilHealthCard[0].path
    }

    // i think here is a mistke what if not not get localfilepath
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    const soilHealthCard = await uploadOnCloudinary(soilHealthCardLocalPath)

    const user = await User.create({
        userName:userName.toLowerCase(),
        fullName,
        email,
        aadhar_no,
        mobile_no,
        sex, 
        area_of_land,
        password,
        coverImage : coverImage?.url || "",
        soilHealthCard : soilHealthCard?.url || ""
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500 , "Something went wrong while registering the user ")
    }

    return res.status(201).json(
        new ApiResponse(201,createdUser , "User registered successfully")
    )

})

const loginUser = asyncHnadler( async (req,res)=>{
    // take data from req->body
    // username or email
    // find the user
    // password check 
    // if matches then give user refresh token and access token 
    // send cookie

    const {userName , email , password} = req.body

    if (!(userName || email)) {
        throw new ApiError(400 , " username or email is required")
    }

    const user = await User.findOne({
        $or : [{userName} , {email}]
    })

    if(!user){
        throw new ApiError(404 , "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401 , "Password is not correct.")
    }

    const {accessToken , refreshToken} = await generateAccessAndRefreshTokens(user._id)
    //upto this point refreshtokens are not in the user taken above as refreshtoken is generated after user refrence is taken 
    // so either make a db call or update the previous user object 

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    // for sending cookies 

    const options = {
        httpOnly : true,
        secure : true  // by these values being true cookies can only be modifiable through server 
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken", refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser ,accessToken , refreshToken
            },
            "User loggedIn successfully"
        )
    )

})

const logoutUser = asyncHnadler( async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{refreshToken:undefined}
        },
        {
            new : true
        }
    )

    const options = {
        httpOnly : true,
        secure : true 
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200 , {} , "User logged out "))

})

const refreshAccessToken = asyncHnadler(async(req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401 , "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify( incomingRefreshToken , process.env.REFRESH_TOKEN_SECRET )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401 , "invalid refresh token ")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401 , "Refresh Token is expired or used")
        }
    
        const options={
            httpOnly:true,
            secure : true,
        }
    
        const {accessToken , newRefreshToken } = await generateAccessAndRefreshTokens(user._id);
    
        return res
        .status(200)
        .cookie("accessToken",accessToken , options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,
                    refreshToken : newRefreshToken
                },
                "Access Token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token ")
    }
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}