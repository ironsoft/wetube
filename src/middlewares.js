import multer from "multer";
import multerS3 from "multer-s3";
import aws from "aws-sdk";

const s3 = new aws.S3({
    credentials: {
        accessKeyId: process.env.AWS_ID,
        secretAccessKey: process.env.AWS_SECRET,
    }
})

const isHeroku = process.env.NODE_ENV === "production";

const s3ImageUploader = multerS3({
    s3: s3,
    bucket: 'wetube-ishopfloor/images',
    acl: 'public-read',
})

const s3VideoUploader = multerS3({
    s3: s3,
    bucket: 'wetube-ishopfloor/videos',
    acl: 'public-read',
})

// locals
export const localMiddleware = (req, res, next) => {
    res.locals.loggedIn = Boolean(req.session.loggedIn);
    res.locals.siteName = "Wetube";
    res.locals.loggedInUser = req.session.user || {};
    res.locals.isHeroku = isHeroku;
    next();
}

// 로그인 한 사람만 볼 수 있는 페이지
export const protectorMiddleware = (req, res, next) => {
    // 로그인한 사람이면 그냥 통과
    if (req.session.loggedIn) {
        return next();
    // 로그인하지 않은 사람이면,
    } else {
        req.flash("error", "Log in first");
        return res.redirect("/login");
    }

}

// 로그인 하지 않은 사람만 볼 수 있는 페이지
export const publicOnlyMiddleware = (req, res, next) => {
    // 로그인 하지 않은 사람이면 통과
    if (!req.session.loggedIn) {
        return next();
    // 로그인 한 사람이면,
    } else {
        req.flash("error", "Not authorized");
        return res.redirect("/");
    }
}



// avatar 파일 업로드
export const avatarUpload = multer({
    // 파일저장 폴더 지정
    dest: "uploads/avatars/",
    // 업로드 가능한 파일용량 지정
    limits: {
        //3000000 bytes = 3MB
        fileSize: 3000000,
    },
    storage: isHeroku ? s3ImageUploader : undefined,
    // "s3:x-amz-acl": ["public-read"],
})

// video 파일 업로드
export const videoUpload = multer({
    dest: "uploads/videos/",
    limits: {
        // 10000000 bytes = 10MB
        fileSize: 10000000,
    },
    storage: isHeroku ? s3VideoUploader : undefined,
})

