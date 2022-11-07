import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";

const actionBtn = document.getElementById("actionBtn");
const video = document.getElementById("preview");

let stream;
let recorder;
let videoFile;

const files = {
    input: "recording,webm",
    output: "output.mp4",
    thumb: "thumbnail.jpg",
}

const downloadFile = (fileUrl, fileName) => {
    const a = document.createElement("a");
    a.href = fileUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
}

const handleDownload = async () => {

    actionBtn.removeEventListener("click", handleDownload);
    actionBtn.innerText = "Transcoding..."
    actionBtn.disabled = true;

    const ffmpeg = createFFmpeg({ log: true });
    await ffmpeg.load();

    ffmpeg.FS("writeFile", files.input, await fetchFile(videoFile));
    await ffmpeg.run("-i", files.input, "-r" , "60", files.output);
    await ffmpeg.run("-i", files.input, "-ss" , "00:00:01", "-frames:v", "1", files.thumb);

    const mp4File = ffmpeg.FS("readFile", files.output);
    const thumbFile = ffmpeg.FS("readFile", files.thumb);

    const mp4Blob = new Blob([mp4File.buffer], { type: "video/mp4"});
    const thumBlob = new Blob([thumbFile.buffer], {type: "image/jpg"});

    const mp4Url = URL.createObjectURL(mp4Blob);
    const thumUrl = URL.createObjectURL(thumBlob);

    downloadFile(mp4Url, "MyRecording.mp4");
    downloadFile(thumUrl, "MyThumbnail.jpg");

    ffmpeg.FS("unlink", files.input);
    ffmpeg.FS("unlink", files.output);
    ffmpeg.FS("unlink", files.thumb);

    URL.revokeObjectURL(mp4Url);
    URL.revokeObjectURL(thumUrl);
    URL.revokeObjectURL(videoFile);

    actionBtn.disabled = false;
    actionBtn.innerText = "Record Again";
    actionBtn.addEventListener("click", handleStart);
}

// const handleStop = () => {
//     // actionBtn.innerText = "Start Recording";
//     actionBtn.innerText = "Download Recording";
//     actionBtn.removeEventListener("click", handleStop);
//     actionBtn.addEventListener("click", handleDownload);
//     recorder.stop();
// }


const handleStart = () => {
    actionBtn.innerText = "Recording..";
    actionBtn.disabled = true;
    actionBtn.removeEventListener("click", handleStart);
    recorder = new MediaRecorder(stream, {mimeType: "video/webm"});
    // 비디오가 중단 되었을 때, 즉 stop() 되었을 때 자동 트리거되는 media recorder 이벤트임.
    recorder.ondataavailable = (event) => {
        videoFile = URL.createObjectURL(event.data)
        // 실시간으로 화면이 보여지는 것을 멈추기.
        video.srcObject = null;
        video.src = videoFile;
        // 녹화된 비디오가 반복 재생됨.
        video.loop = true;
        video.play();
        actionBtn.innerText = "Download";
        actionBtn.disabled = false;
        actionBtn.addEventListener("click", handleDownload);
    };
    // 녹화시작
    recorder.start();
    // 5초간만 녹화
    setTimeout(() => {
        recorder.stop();
    }, 5000);
}


// 웹캠작동
const init = async () => {
    stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {width: 1024, height: 576},
        
    });

    video.srcObject = stream;
    video.play();

};

init();

actionBtn.addEventListener("click", handleStart);
