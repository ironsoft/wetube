import bcrypt from "bcrypt";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email: {type: String, required: true, unique: true},
    avatarUrl: String,
    socialOnly: {type: Number, default: false},
    username: {type: String, required: true, unique: true},
    password: {type: String,},
    name: {type: String, required: true},
    location: String,
    comments: [{type: mongoose.Schema.Types.ObjectId, ref: "Comment"}],
    videos: [{type: mongoose.Schema.Types.ObjectId, ref: "Video"},]
});

// 비밀전호 해시하기
userSchema.pre("save", async function(){
    if(this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 5)
    }

});

const User = mongoose.model("User", userSchema);
export default User;