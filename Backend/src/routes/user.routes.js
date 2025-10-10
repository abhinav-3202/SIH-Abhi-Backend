import { Router } from "express";
import { loginUser, logoutUser, registerUser ,refreshAccessToken } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router();

router.route("/register").post(
    upload.fields([  // for files uploading injected a middleware upload
        {
            name: "coverImage",  // this name should be same in frontend and backend as well 
            maxCount:1,
        },
        {
            name : "soilHealthCard" ,
            maxCount:1,
        }
    ]),
    registerUser
    )

router.route("/login").post(loginUser)

//secured routes

router.route("/logout").post(verifyJWT ,logoutUser)
router.route("/refresh-token").post(refreshAccessToken)

export default router