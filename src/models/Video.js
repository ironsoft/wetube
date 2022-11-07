import mongoose from "mongoose";


const videoSchema = new mongoose.Schema({
    title: {type: String, required: true, trim: true, maxLength: 80},
    fileUrl: {type: String, required: true},
    thumbUrl: {type: String, required: true},
    description: {type: String, required: true, trim: true, minLength: 20},
    createdAt: {type: Date, required: true, default: Date.now},
    hashtags: [{type: String, trim: true}],
    meta: {
        views: {type: Number, default: 0, requred: true},
        rating: {type: Number, default: 0, requred: true},
    },
    comments: [{type: mongoose.Schema.Types.ObjectId, ref: "Comment"},],
    owner: {type: mongoose.Schema.Types.ObjectId, required: true, ref: "User"},
});

// static 활용하기
videoSchema.static('formatHashtags', function(hashtags) {
    return hashtags.split(",").map((word) => (word.startsWith("#") ? word : `#${word}`))
} )


// 스키마를 바탕으로 비디오 모델 생성
const Video = mongoose.model("Video", videoSchema);
export default Video;