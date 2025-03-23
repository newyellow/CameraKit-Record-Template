// Modify into a module from CanvasRecorder.js - smusamashah
// https://webrtc.github.io/samples/src/content/capture/canvas-record/

import settings from "./settings";

export class CanvasRecorder {
    constructor(canvas, audioStreams, video_bits_per_sec) {
        // Check if required APIs are supported
        if (!navigator.mediaDevices || !MediaRecorder || !canvas.captureStream) {
            throw new Error('Your browser does not support the required recording features');
        }

        this.canvas = canvas;
        this.video_bits_per_sec = video_bits_per_sec;
        this.recordedBlobs = [];
        this.supportedType = null;
        this.mediaRecorder = null;
        this.recordStream = null;

        try {
            // Get canvas stream
            this.canvasStream = canvas.captureStream(settings.recordVideoFrameRate); // Specify framerate explicitly

            // mix audio streams
            let mixAudioContext = new AudioContext();
            let mixDestination = mixAudioContext.createMediaStreamDestination();

            for(let i=0; i<audioStreams.length; i++) {
                let newStream = mixAudioContext.createMediaStreamSource(audioStreams[i]);
                newStream.connect(mixDestination);
            }

            
            let audioTracks = [];
            for(let i=0; i<audioStreams.length; i++) {
                audioTracks.push(...audioStreams[i].getAudioTracks());
            }

            console.log('Recording Audio Tracks:');
            console.log(audioTracks);
            
            this.recordStream = new MediaStream();
            this.recordStream.addTrack(this.canvasStream.getVideoTracks()[0]);
            this.recordStream.addTrack(mixDestination.stream.getAudioTracks()[0]);

            if (!this.recordStream) {
                throw new Error('Failed to create stream');
            }
        } catch (e) {
            console.error('Stream creation failed:', e);
            throw new Error('Failed to initialize canvas stream');
        }

        this.video = document.createElement('video');
        this.video.style.display = 'none';
    }

    start() {
        // Prioritize more widely supported codecs first
        let types = settings.recodeVideoCodecs;

        for (let type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                this.supportedType = type;
                break;
            }
        }

        console.log('Using MIME type:', this.supportedType);

        if (!this.supportedType) {
            throw new Error("No supported video format found");
        }

        let options = {
            mimeType: this.supportedType,
            videoBitsPerSecond: this.video_bits_per_sec || 2500000
        };

        try {
            this.mediaRecorder = new MediaRecorder(this.recordStream, options);
        } catch (e) {
            console.error('MediaRecorder creation failed:', e);
            throw new Error('Failed to create MediaRecorder');
        }

        this.recordedBlobs = [];
        this.mediaRecorder.onstop = this.handleStop.bind(this);
        this.mediaRecorder.onerror = (event) => {
            console.error('MediaRecorder error:', event);
        };
        this.mediaRecorder.ondataavailable = this.handleDataAvailable.bind(this);

        try {
            this.mediaRecorder.start(100);
        } catch (e) {
            console.error('MediaRecorder start failed:', e);
            throw new Error('Failed to start recording');
        }
    }

    handleDataAvailable(event) {
        if (event.data && event.data.size > 0) {
            this.recordedBlobs.push(event.data);
        }
    }

    handleStop(event) {
        console.log('Recorder stopped: ', event);
        const superBuffer = new Blob(this.recordedBlobs, { type: this.supportedType });
        this.video.src = window.URL.createObjectURL(superBuffer);
    }

    stop() {
        this.mediaRecorder.stop();
        console.log('Recorded Blobs: ', this.recordedBlobs);
        this.video.controls = true;
    }

    async share(file_name) {
        const fileName = file_name || 'recording.webm';
        let resultFile = new File([this.recordedBlobs], fileName, { type: 'video/webm' });

        let shareData = {
            files: [resultFile],
            title: 'Share Recording',
            text: 'Check out my recording!'
        };

        // console.log('Share Data:', shareData);
        // console.log('Can Share:', navigator.canShare(shareData));

        if (navigator.canShare(shareData)) {
            await navigator.share(shareData).catch((error) => {
                console.error('Sharing failed:', error);
                this.save(file_name);
            });
        }
        else {
            this.save(file_name);
        }
    }

    save(file_name) {
        const name = file_name || 'recording.webm';
        const blob = new Blob(this.recordedBlobs, { type: this.supportedType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 100);
    }
}
