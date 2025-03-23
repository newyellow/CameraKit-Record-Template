import { bootstrapCameraKit, createMediaStreamSource } from "@snap/camera-kit";
import { CanvasRecorder } from './CanvasRecorder.js';
import settings from "./settings";
import helpers from "./helpers";

const API_TOKEN = 'insert-your-token';
const LENS_GROUP_ID = 'insert-your-group-id';

const TARGERT_LENS_ID = 'your-display-lens-id';


// global variables
let global = {
    cameraKit: null,
    renderTarget: null,
    // might need another "capture render target" but ignore for now

    session: null,
    userMediaStream: null,
    mediaStreamSource: null,
    lens: null,

    canvasRecorder: null,

    // temp
    audioRecorder: null,

    // for monitoring
    audioContexts: [],

    monitorNodes: [],
    monitorAudioRecorder: null,
    monitorAudioChunks: [],
};

async function start() {

    // setup monitor stuff
    setupAudioContextMonitor();
    setupAudioNodeMonitor();

    // init camera kit
    await setupCameraKit();

    // setup buttons
    setupRecordButton();

    // setup rwd
    window.addEventListener('resize', updateRenderSize);
}

async function setupCameraKit() {
    const cameraKit = await bootstrapCameraKit({
        apiToken: API_TOKEN
    });
    global.cameraKit = cameraKit;

    const liveRenderTarget = document.getElementById('camerakit-canvas');

    // Set canvas properties for better quality
    if (helpers.isMobile()) {
        liveRenderTarget.width = 1080;
        liveRenderTarget.height = 1920;
    }
    else {
        liveRenderTarget.width = 1920;
        liveRenderTarget.height = 1080;
    }
    global.renderTarget = liveRenderTarget;

    const session = await cameraKit.createSession({
        liveRenderTarget,
        renderOptions: {
            quality: 'high',
            antialiasing: true
        }
    });
    global.session = session;

    const userMediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
    });
    global.userMediaStream = userMediaStream;

    const mediaStreamSource = await createMediaStreamSource(userMediaStream, {
        cameraType: "user",
        disableSourceAudio: false,
    });
    global.mediaStreamSource = mediaStreamSource;

    await session.setSource(mediaStreamSource);
    await session.play();

    // Update render size with high quality settings
    mediaStreamSource.setRenderSize(window.innerWidth, window.innerHeight);

    const lens = await cameraKit.lensRepository.loadLens(TARGERT_LENS_ID, LENS_GROUP_ID);
    await session.applyLens(lens);
}

function setupAudioContextMonitor() {
    const originalAudioContext = window.AudioContext || window.webkitAudioContext;
    let capturedAudioContext = null;

    window.AudioContext = window.webkitAudioContext = function () {
        capturedAudioContext = new originalAudioContext();
        console.log("Audio context created:", capturedAudioContext);

        global.audioContexts.push(capturedAudioContext);

        return capturedAudioContext;
    };
}

function setupAudioNodeMonitor() {
    // Store the original connect method
    const originalConnect = AudioNode.prototype.connect;

    // Override the AudioNode.prototype.connect method
    AudioNode.prototype.connect = function (destinationNode) {

        // check context id
        for (let i = 0; i < global.audioContexts.length; i++) {
            if (this.context === global.audioContexts[i]) {
                console.log("Context id: ", i);
            }
        }

        console.log("Connecting: " + this + " to " + destinationNode);
        console.log(this);
        console.log(destinationNode);

        // if the current node is a gainNode, create another stream node and connect it
        if (destinationNode instanceof AudioDestinationNode) {
            console.log("final node found");

            // create monitor node
            let streamNode = this.context.createMediaStreamDestination();
            global.monitorNodes.push(streamNode);

            // connect current node to the monitor node
            this.connect(streamNode);
        }

        // Call original connect method
        return originalConnect.apply(this, arguments);
    };
}

function setupRecorder() {
    try {

        let monitoredStreams = [];

        // add lens audios into the record stream
        if (settings.recordLensAudio) {
            for (let i = 0; i < global.monitorNodes.length; i++) {
                monitoredStreams.push(global.monitorNodes[i].stream);
            }
        }

        // add user media stream into the record stream
        if (settings.recordMicrophoneAudio) {
            monitoredStreams.push(global.userMediaStream);
        }

        let newRecorder = new CanvasRecorder(
            global.renderTarget,
            monitoredStreams,
            settings.videoBitsPerSecond
        );

        global.canvasRecorder = newRecorder;
    } catch (e) {
        console.error('Failed to create recorder:', e);
        alert('Sorry, recording is not supported on your device');
        return;
    }
}

function setupRecordButton() {
    const recordButton = document.getElementById("record-button");
    let isRecording = false;
    let canRecord = true;

    recordButton.addEventListener("click", async () => {

        if (global.canvasRecorder == null) {
            setupRecorder();
        }

        if (!isRecording) {
            // Start recording
            if (global.canvasRecorder != null) {
                try {
                    global.canvasRecorder.start();
                    recordButton.style.backgroundImage = "url('./assets/RecordStop.png')";

                    isRecording = true;
                } catch (e) {
                    console.error('Failed to start recording:', e);
                    alert('Failed to start recording. Please try again.');
                    return;
                }
            }
        } else {
            // Stop recording
            try {
                global.canvasRecorder.stop();
                recordButton.style.backgroundImage = "url('./assets/RecordButton.png')";
                await global.canvasRecorder.save("snapchat-recording.webm");
                // await global.canvasRecorder.share("snapchat-recording.webm");

                isRecording = false;
            } catch (e) {
                console.error('Failed to stop/save recording:', e);
                alert('Failed to save recording. Please try again.');
                return;
            }
        }
    });
}

function updateRenderSize() {
    let targetWidth = window.innerWidth;
    let targetHeight = window.innerHeight;

    if (global.renderTarget) {
        global.renderTarget.style.width = `${targetWidth}px`;
        global.renderTarget.style.height = `${targetHeight}px`;
    }

    if (global.mediaStreamSource) {
        global.mediaStreamSource.setRenderSize(targetWidth, targetHeight);
    }
}

function displayPostRecordButtons(url, fixedBlob) {
    const actionbutton = document.getElementById("action-buttons")
    const backButtonContainer = document.getElementById("back-button-container")
    const switchButton = document.getElementById("switch-button")

    actionbutton.style.display = "block"
    backButtonContainer.style.display = "block"
    switchButton.style.display = "none"

    document.getElementById("download-button").onclick = () => {
        const a = document.createElement("a")
        a.href = url
        a.download = "recording.mp4"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
    }

    // ... rest of the button handling code ...
}

// sleep
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

start();