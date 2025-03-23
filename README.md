# CameraKit-Template
This is a NodeJS Vite + Vanilla JS template for Lens Studio CameraKit displyer, with the ability to record both video and audio (both microphone and Lens audio).

Part of this project's assets and code are based on @GOWAAA's repo [camera-kit-web-w-recordfeature](https://github.com/GOWAAA/camerakit-web-w-recordfeature/)


## Web Demo
You can try the recording feature here: [https://newyellow.idv.tw/test-camera-kit](https://newyellow.idv.tw/test-camera-kit)


## How the Audio Recording Works
This is the most commonly asked question in the community.

Currently, the CameraKit API doesn't provide AudioStream access in Lens. However, by overriding the built-in functions in the WebAudioAPI, we can monitor how the CameraKit API initializes audio and insert a monitor AudioNode that allows us to record.

Here is the code from `main.js` where you can monitor all the `AudioContext` objects created during the initialization of the CameraKit API:
```js
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
```

And here is the code from `main.js` where you can insert an additional `AudioNode` and then use it for recording audio later:
```js
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
```
