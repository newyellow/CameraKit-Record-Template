import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import settings from "./settings";
import helpers from "./helpers";

export class VideoProcessor {
    constructor() {
        this.ffmpeg = new FFmpeg();
        this.loaded = false;

        this.init();
    }

    async init() {
        try {
            console.log("Loading FFmpeg ...");

            await this.ffmpeg.load({
                log: true,
                corePath: './ffmpeg/0.12.10/ffmpeg-core.js'
            });

            this.loaded = true;
            console.log("FFmpeg loaded successfully");
        } catch (error) {
            console.log("Error loading FFmpeg:" + error);
            throw error;
        }
    }

    async processVideo(blob, sourceCodec) {
        // handle loading fail
        if(this.loaded == false) {
            let loadedResult = await this.waitForLoading();

            if(!loadedResult) {
                return false;
            }
        }

        try {
            // process media
            const buffer = await blob.arrayBuffer();

            // Write the input file using the correct API
            await this.ffmpeg.writeFile('input.mp4', new Uint8Array(buffer));

            // Set up progress monitoring
            this.ffmpeg.on('progress', ({ progress, time }) => {
                console.log(`Processing: ${progress}% at ${time}`);
            });

            // Preserve original video properties while adding faststart
            await this.ffmpeg.exec([
                '-i', 'input.mp4',
                '-movflags', '+faststart',  // Enable fast start for web playback
                '-c:v', 'copy',             // Copy video stream without re-encoding
                '-c:a', 'aac',              // Convert audio to AAC
                // '-r', 'copy',               // Preserve original framerate
                // '-vsync', '0',              // Preserve frame timestamps
                'output.mp4'
            ]);

            // read the result using the correct API
            const resultData = await this.ffmpeg.readFile('output.mp4');

            // create a blob URL for the result
            const resultBlob = new Blob([resultData], { type: sourceCodec });

            // Clean up files
            await this.ffmpeg.deleteFile('input.mp4');
            await this.ffmpeg.deleteFile('output.mp4');

            return resultBlob;
        } catch (error) {
            console.log("Error processing video: " + error);
            // Clean up any remaining files
            try {
                await this.ffmpeg.deleteFile('input.mp4');
                await this.ffmpeg.deleteFile('output.mp4');
            } catch (cleanupError) {
                console.error("Error during cleanup:", cleanupError);
            }
            throw error;
        }
    }

    async waitForLoading(maxWaitTime = 10000) {
        const startTime = Date.now();

        while (!this.loaded) {
            if (Date.now() - startTime > maxWaitTime) {
                console.log("FFmpeg loading timed out");
                return false;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        return true;
    }
}