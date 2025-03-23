const settings = {
    recordVideoFrameRate: 30,
    recordVideoBitsPerSecond: 8000000,

    recordMicrophoneAudio: true,
    recordLensAudio: true,

    recodeVideoCodecs: [
        'video/webm;codecs=vp9',
        'video/webm;codecs=h264',
        'video/webm;codecs=vp8',
        'video/webm'
    ]
}

export default settings;