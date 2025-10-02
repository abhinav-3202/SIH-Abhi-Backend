import { asyncHnadler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

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

export {registerUser}