const video = document.querySelector("video");
const playBtn = document.getElementById("play");
const playBtnIcon = playBtn.querySelector("i");
const muteBtn = document.getElementById("mute");
const muteBtnIcon = muteBtn.querySelector("i");
const volumeRange = document.getElementById("volume");
const currentTime = document.getElementById("currentTime");
const totalTime = document.getElementById("totalTime");
const timeline = document.getElementById("timeline"); 
const fullScreenBtn = document.getElementById("fullScreen");
const fullScreenBtnIcon = fullScreenBtn.querySelector("i");
const videoContainer = document.getElementById("videoContainer");
const videoControls = document.getElementById("videoControls");


let controlsTimeout = null;
let controlsMovementTimeout = null;
let volumeValue = 0.5;
video.volume = volumeValue;


// 비디오 플레이
const handlePlayClick = (event) => {

    // if the video is playing, pause it,
    if(video.paused) {
        video.play();
    // else platy the video
    } else {
        video.pause();
    }
    playBtnIcon.classList = video.paused ? "fas fa-play" : "fas fa-pause";
}



// 소음버튼
const handleMute = () => {

    // Mute 버튼을 클릭했을 때 당시에 video가 무음이면 true 유음이면 false
    if (video.muted) {
        video.muted = false;
    } else {
        video.muted = true;
    }
    muteBtnIcon.classList = video.muted ? "fas fa-volume-mute" : "fa fa-volume-up";
    volumeRange.value = video.muted ? 0 : volumeValue;
};

// 볼륨조절 바
const handleVolumeChange = (event) => {
    const {
        target: {value},
    } = event;
    if (video.muted) {
        video.muted = false;
        muteBtn.innerText = "Mute";
    }
    volumeValue = value;
    video.volume = value;

    if (Number(value) === 0) {
        muteBtn.innerText = "Unmute";
        video.muted = true;
    } else {
        muteBtn.innerText = "Mute";
        video.muted = false;
    }
}

// 비디오 시간 포멧
const formatTime = (seconds) => new Date(seconds*1000).toISOString().substr(14, 5);


// 비디오 전체 시간
const handleLoadedMetadata = () => {
    totalTime.innerText = formatTime(Math.floor(video.duration));
    timeline.max = Math.floor(video.duration);
};

// 비디오 플레이시 현재 시간
const handleTimeUpdate = () => {
 
    currentTime.innerText = formatTime(Math.floor(video.currentTime));
    timeline.value = Math.floor(video.currentTime);
}

// 비디오 바를 움직일 때 실제 영상이 그 위치로 가는 기능
const handleTimelineChange = (event) => {

    const { target: {value}, } = event;
    video.currentTime = value;


}

// 풀스크린 만들기
const handleFullscreen = () => {
    const fullscreen = document.fullscreenElement;
    if (fullscreen) {
        document.exitFullscreen();
        fullScreenBtnIcon.classList = "fas fa-expand";
    } else {
        videoContainer.requestFullscreen();
        fullScreenBtnIcon.classList = "fas fa-compress";
    }
};

// 컨트롤러 숨기기
const hideControls = () => videoControls.classList.remove("showing");

// 마우스 화면 안에 컨트롤러 보이기
const handleMouseMove = () => {
    // 만약 이미 존재하는 controlsTimeout 이 있으면 삭제해 주기.
    if (controlsTimeout) {
        clearTimeout(controlsTimeout);
        controlsTimeout = null;
    }
    // 화면 안에서 3초 안에 또다시 움직임이 있으면 controlsMovementTimeout에 기존의 setTimeout의 id 값이 존재하기에 삭제하고 새로운 id 값을 받을 수 있도록 clearTimeout해 줌. 
    if (controlsMovementTimeout) {
        clearTimeout(controlsMovementTimeout);
        controlsMovementTimeout = null;
    }
    videoControls.classList.add("showing");
    // 화면 안에서 마우스를 움직일때마다 3초 뒤에 controls 가 사라지도록. 만약 추가 움직임이 없는 경우에는 3초 뒤에 자동으로 controlsMovementTimeout 는 null 이 됨. 
    controlsMovementTimeout = setTimeout(hideControls, 3000);
}

// 마우스 화면 안에 컨트롤러 사라지기
const handleMouseLeave = () => {
    
    const id = setTimeout(hideControls, 3000);

    controlsTimeout = id;
    
}


// 비디오 시정이 끝나면,
const handleEnded = async () => {
    const {id} = videoContainer.dataset;
    await fetch(`/api/videos/${id}/view`, {
        method: "POST",
    });
}



playBtn.addEventListener("click", handlePlayClick);
volumeRange.addEventListener("input", handleVolumeChange);
muteBtn.addEventListener("click", handleMute);
video.addEventListener("loadedmetadata", handleLoadedMetadata);
video.addEventListener("timeupdate", handleTimeUpdate);
video.addEventListener("ended", handleEnded);
timeline.addEventListener("input", handleTimelineChange);
fullScreenBtn.addEventListener("click", handleFullscreen)
videoContainer.addEventListener("mousemove", handleMouseMove);
videoContainer.addEventListener("mouseleave", handleMouseLeave);
videoContainer.addEventListener("click", handlePlayClick);
document.addEventListener("keyup", (event) => {
    if (event.code == "Space"){
        handlePlayClick();
    }
});