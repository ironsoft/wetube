import User from "../models/User";
import Video from "../models/Video";

// 메인 페이지. 전체 비디오 목록 보여주기
export const home = async (req, res) => {
    try {
        const videos = await Video.find({}).sort({createdAt: "desc"}).populate("owner");
        return res.render("home", {pageTitle: "Home", videos});
    } catch (error) {
        return res.render("server-error", {error});
    }
};
 
// 비디오 상세 페이지 보기
export const watch = async (req, res) => {
    const {id} = req.params;
    const video = await Video.findById(id).populate("owner");

    if (!video) {
        return res.render("404", {pageTitle: "Video not found."});
    }
    return res.render("watch", {pageTitle: video.title, video});    
};

// 비디오 수정을 위한 폼 보여주기
export const getEdit = async (req, res) => {
    const {id} = req.params;
    const {user: {_id},} = req.session;
    const video = await Video.findById(id);
    if (!video) {
        return res.status(404).render("404", {pageTitle: "Video not found."});
    }

    if (String(video.owner) !== String(_id)) {
        return res.status(403).redirect("/");
    }
    return res.render("edit", {pageTitle: `Edit ${video.title}`, video});    
};

// 비디오 수정하기
export const postEdit = async (req, res) => {
    const {user: {_id},} = req.session;
    const {id} = req.params;
    const {title, description, hashtags} = req.body;
    
    const video = await Video.findById(id);

    if (!video) {
        return res.status(404).render("404", {pageTitle: "Video not found."});
    }
 
    if (String(video.owner) !== String(_id)) {
        return res.status(403).redirect("/");
    }

    await Video.findByIdAndUpdate(id, {
        title,
        description,
        hashtags: Video.formatHashtags(hashtags),
    })

    return res.redirect(`/videos/${id}`);
};

// 비디오 생성을 위한 폼 보여주기
export const getUpload = (req, res) => {
    return res.render("upload", {pageTitle: "Upload Video"});
}

// 비디오 업로드
export const postUpload = async (req, res) => {
    const {user: {_id},} = req.session;
    const {path: fileUrl} = req.file;
    const {title, description, hashtags} = req.body;
    try {
        const newVideo = await Video.create({
            title: title,
            description: description,
            fileUrl,
            // createdAt: Date.now(),
            owner: _id,
            hashtags: Video.formatHashtags(hashtags),
            meta: {
                views: 0,
                rating: 0,
            },
        });
        const user = await User.findById(_id);
        user.videos.push(newVideo);
        user.save();

        return res.redirect("/");       

    } catch (error) {
        console.log(error);
        return res.status(400).render("upload", {
            pageTitle: "Upload Video", 
            errorMessage: error._message,
        });
    }
}

export const deleteVideo = async (req, res) => {
    const {user: {_id},} = req.session;
    const {id} = req.params;
    const video = await Video.findById(id);
    if (!video) {
        return res.status(404).render("404", {pageTitle: "Video not found."});
    }
    if (String(video.owner) !== String(_id)) {
        return res.status(403).redirect("/");
    }
    await Video.findByIdAndDelete(id);
    return res.redirect("/");
}

// 비디오 서치
export const search = async (req, res) => {
    const { keyword } = req.query;
    let videos = []
    if (keyword) {
        // search
        videos = await Video.find({
            title: {
                $regex: new RegExp(keyword, "i")
            },
        }).populate("owner");
    }
    return res.render("search", {pageTitle: "Search", videos});
} 