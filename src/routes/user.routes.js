import {Router} from 'express';
import {loggedoutUser, loginUser, registerUser,refreshAccessToken} from '../controllers/user.controller.js';

import pkg from 'jsonwebtoken';
const { verify } = pkg;
import {upload} from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
const router= Router();

router.route("/register").post(upload.fields([
    {
        name: 'avatar',
        maxCount: 1
    },
    {
        name: 'coverImage',
        maxCount: 1
    }
]),registerUser)

router.route("/login").post(loginUser);

router.route("/logout").post(verifyJWT,loggedoutUser)

router.route("/refresh-token").post(verifyJWT, refreshAccessToken);

export default router;