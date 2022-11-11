import User from "../models/User";
import Video from "../models/Video";
import Comment from "../models/Comment";
import { async } from "regenerator-runtime";

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
    const video = await Video.findById(id).populate("owner").populate("comments");
    console.log(video);
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
        req.flash("error", "You are not the owner of the video.")
        return res.status(403).redirect("/");
    }

    await Video.findByIdAndUpdate(id, {
        title,
        description,
        hashtags: Video.formatHashtags(hashtags),
    })
    req.flash("success", "Changes Saved!")
    return res.redirect(`/videos/${id}`);
};

// 비디오 생성을 위한 폼 보여주기
export const getUpload = (req, res) => {
    return res.render("upload", {pageTitle: "Upload Video"});
}

// 비디오 업로드
export const postUpload = async (req, res) => {
    const {user: {_id},} = req.session;
    const {video, thumb} = req.files;

    const {title, description, hashtags} = req.body;

    const isHeroku = process.env.NODE_ENV === "production";

    try {
        const newVideo = await Video.create({
            title: title,
            description: description,
            fileUrl: isHeroku ? video[0].location : video[0].path,
            thumbUrl: isHeroku ? thumb[0].location : thumb[0].path,
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

        return res.status(400).render("upload", {
            pageTitle: "Upload Video", 
            errorMessage: error._message,
        });
    }
}

// 비디오 삭제
export const deleteVideo = async (req, res) => {
    const {user: {_id},} = req.session;
    const {id} = req.params;
    const video = await Video.findById(id);
    if (!video) {
        return res.status(404).render("404", {pageTitle: "Video not found."});
    }
    if (String(video.owner) !== String(_id)) {
        req.flash("error", "Not authorized");
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

// 비디오 조회수 증가시키기
export const registerView = async (req, res) => {
    const { id } = req.params;
    const video = await Video.findById(id);
    // 비디오가 발견되지 않으면,
    if (!video) {
        return res.sendStatus(404);
    }
    video.meta.views = video.meta.views + 1;
    await video.save();
    return res.sendStatus(200);
} 

// 댓글 저장하기
export const createComment = async (req, res) => {
    const {
        params: { id },
        body: { text },
        session: { user },
    } = req;

    const video = await Video.findById(id);

    if (!video) {
        return res.sendStatus(404);
    }

    const comment = await Comment.create({
        text: text,
        owner: user._id,
        video: id,
    });
    video.comments.push(comment._id);
    video.save();

    const owner = await User.findById(user._id);
    owner.comments.push(comment._id);
    owner.save();

    // 201은 Created 성공 되었을 때,
    return res.status(201).json({newCommentId: comment._id, newVideoId: video._id});
}

// 댓글 삭제하기
export const deleteComment = async (req, res) => {
    const {id, videoid} = req.body;
    const { _id } = req.session.user;
    const { owner } = await Comment.findById(id);
    const video = await Video.findById(videoid);
    if (String(owner) !== _id) return res.sendStatus(403);
    else {
        await Comment.findByIdAndDelete(id);
        video.comments.splice(video.comments.indexOf(videoid), 1);
        video.save();
        return res.sendStatus(200)
    }
}