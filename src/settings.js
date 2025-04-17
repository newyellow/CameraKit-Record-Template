const settings = {
    recordVideoFrameRate: 60,
    recordVideoBitsPerSecond: 6000000,
    recordAudioBitsPerSecond: 128000,

    recordedFileName: 'recording',
    snapshotFileName: 'snapshot',

    recordMicrophoneAudio: true,
    recordLensAudio: true,
    processVideoWithFFmpeg: true,

    recodeVideoCodecs: [
        {
            codecString: 'video/webm;codecs=vp9',
            container: 'webm',
        },
        {
            codecString: 'video/webm',
            container: 'webm',
        },
        {
            codecString: 'video/mp4',
            container: 'mp4',
        }
    ],

    defaultCameraType: 'BACK', // 'BACK' or 'FRONT'
    showDebugLog: true
}

export default settings;