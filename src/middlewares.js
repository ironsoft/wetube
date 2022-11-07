import multer from "multer";

export const localMiddleware = (req, res, next) => {
    res.locals.loggedIn = Boolean(req.session.loggedIn);
    res.locals.siteName = "Wetube";
    res.locals.loggedInUser = req.session.user || {};
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
    }
})

// video 파일 업로드
export const videoUpload = multer({
    dest: "uploads/videos/",
    limits: {
        // 10000000 bytes = 10MB
        fileSize: 10000000,
    }

})

