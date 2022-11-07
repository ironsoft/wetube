
const videoContainer = document.getElementById("videoContainer");
const form = document.getElementById("commentForm");
const videoComment = document.querySelector(".video__comment");
const deleteBtn = document.querySelectorAll(".delete__btn");


// 작성한 댓글 html 생성
const addComment = (text, commentId, videoId) => {
    const videoComments = document.querySelector(".video__comments ul");
    const newComment = document.createElement("li");
    newComment.className = "video__comment";
    const talkIcon = document.createElement("i");
    talkIcon.className = "fas fa-comment"; // fas.fa-comment 하면 안됨
    newComment.appendChild(talkIcon);
    const span = document.createElement("span");
    span.innerText = ` ${text}`;
    newComment.appendChild(span);
    const span2 = document.createElement("span");
    span2.innerText = '  ❌';
    span2.dataset.id = commentId;
    span2.dataset.videoid = videoId;
    span2.className = "delete__btn"
    span2.id = "newDeleteCommentBtn"
    newComment.appendChild(span2);
    videoComments.prepend(newComment);
    const newDeleteCommentBtn = document.getElementById("newDeleteCommentBtn");
    newDeleteCommentBtn.addEventListener("click", handleDelete);
}


// 댓글 백엔드로 보내기
const handleSubmit = async (event) => {
    event.preventDefault();
    const textarea = form.querySelector("textarea");
    const text = textarea.value;
    const videoId = videoContainer.dataset.id;
    if (text === "") {
        return;
    }
    const response = await fetch(`/api/videos/${videoId}/comment`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({text}),
    });
    

    if (response.status === 201) {
        textarea.value = "";
        const {newCommentId, newVideoId} = await response.json();
        addComment(text, newCommentId, newVideoId);
    }
    // window.location.reload();
};

// 댓글 삭제
const handleDelete = async (event) => {
    const { id, videoid } = event.target.dataset;
    const response = await fetch(`/api/videos/${videoid}/comment/${id}/delete`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({id, videoid}),
    });
    if (response.status === 200) {
        event.target.parentNode.remove();
    }


}


// 로그인하지 않은 경우는 form 이 존재하지 않으니
if (form) {
    form.addEventListener("submit", handleSubmit);
}

// deleteComment.addEventListener('click', handleDelete);

if (deleteBtn) {
    deleteBtn.forEach((btn) => {
        btn.addEventListener("click", handleDelete);
    })
}
