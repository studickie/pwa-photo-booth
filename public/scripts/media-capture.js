class MediaCapture {
    constructor() {
        this.videoNode = undefined;
        this.mediaStream = undefined;
        this.videoCapture = undefined;
    }
    get isRecording() {
        return (this.videoCapture && this.videoCapture.isRecording) ? true : false;
    }
    /**
     * @param {HTMLVideoElement} videoNode 
     * @param {Record<String, Number> | undefined} options getUserMedia options: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
     */
    start(videoNode, options) {
        const onStartup = function (resolve) {
            if (!(videoNode instanceof HTMLVideoElement)) {
                throw new Error('Requires a video element');
            }
            this.videoNode = videoNode;

            const onSuccess = function (mediaStream) {
                this.mediaStream = mediaStream;
                this.videoNode.srcObject = this.mediaStream;
                this.videoNode.play();
                resolve();
            }

            navigator.mediaDevices.getUserMedia({
                video: {
                    width: {
                        min: 960,
                        max: 1280
                    }
                },
                audio: {
                    channelCount: 1,
                    sampleRate: 44100,
                    sampleSIze: 16
                }
            }).then(onSuccess.bind(this));
        }

        return new Promise(onStartup.bind(this));
    }
    close() {
        // todo: handle close if videoCapture.isRecording is true

        const mediaTracks = this.mediaStream.getTracks();
        let iteration = 0;
        while (iteration < mediaTracks.length) {
            const track = mediaTracks[iteration];
            track.stop();
            iteration++;
        }
        this.mediaStream = undefined;
        this.videoNode = undefined;
    }
    /**
     * @returns {Promise<CapturedImage>}
     */
    captureImage() {
        const onCaptureImage = function (resolve) {
            const { width, height } = this.videoNode.getBoundingClientRect();
            let canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            canvas.getContext('2d').drawImage(this.videoNode, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg');
            canvas = undefined;
            resolve(new CapturedImage(dataUrl, width, height));
        }
        // return a promise to match "captureVideo", not necessary otherwise
        return new Promise(onCaptureImage.bind(this));
    }
    /**
     * @returns {Promise<CapturedVideo>}
     */
    captureVideo() {
        const onCapture = function (video) {
            this.videoCapture = undefined;
            return new CapturedVideo(video);
        }

        this.videoCapture = new VideoCapture();
        return this.videoCapture.record(this.mediaStream).then(onCapture.bind(this));
    }
    captureVideoStop() {
        this.videoCapture.stop();
    }
}

class VideoCapture {
    constructor() {
        this.mediaRecorder = undefined;
        this.mimeType = undefined;
        if (!window.MediaSource) {
            // assume iOS
            this.mimeType = 'video/mp4';
        } else {
            const mimeTypes = [
                'video/webm',
                'video/webm\;condes=opus', // preferred, but causes error in FireFox
                'video/mp4'
            ];
            let iteration = 0;
            while (iteration < mimeTypes.length) {
                const type = mimeTypes[iteration];
                // marked "experimental", results might not be accurate
                if (MediaSource.isTypeSupported(type) === true) {
                    this.mimeType = type;
                    break;
                }
                iteration++;
            }
        }
        if (!this.mimeType) {
            throw new Error(`Invalid MIME type "${this.mimeType}"`);
        }
    }
    get isRecording() {
        return this.mediaRecorder.state === "recording";
    }
    /**
     * @param {MediaStream} mediaStream 
     * @returns {Promise<Blob>}
     */
    record(mediaStream) {
        const onRecord = function (resolve) {
            let segments = [];
            const maxLength = 15;
            this.mediaRecorder = new MediaRecorder(mediaStream, {
                audioBitsPerSecond: 128000,
                videoBitsPerSecond: 2500000,
                mimeType: this.mimeType
            });

            const onData = function (event) {
                segments.push(event.data);
                (maxLength - segments.length <= 0) && this.mediaRecorder.stop();
            }

            const onStop = function () {
                const videoBlob = new Blob(segments, { type: this.mimeType });
                this.mediaRecorder = undefined;
                segments = undefined;
                resolve(videoBlob);
            }

            this.mediaRecorder.addEventListener('dataavailable', onData.bind(this));
            this.mediaRecorder.addEventListener('stop', onStop.bind(this));
            this.mediaRecorder.start(1000); // new dataavailable event every second
        }
        return new Promise(onRecord.bind(this));
    }
    stop() {
        this.mediaRecorder.stop();
    }
}

class CapturedImage {
    constructor(dataUrl, width, height) {
        this.dataUrl = dataUrl;
        this.width = width;
        this.height = height;
    }
    get type() {
        return 'image';
    }
    get previewSource() {
        return this.dataUrl;
    }
    get dataSource() {
        return this.dataUrl;
    }
}

class CapturedVideo {
    constructor(videoBlob) {
        this.videoBlob = videoBlob;
        this.objectUrl = URL.createObjectURL(videoBlob);
    }
    get type() {
        return 'video';
    }
    get previewSource() {
        return this.objectUrl;
    }
    get dataSource() {
        return this.videoBlob;
    }
    releaseObjectUrl() {
        URL.revokeObjectURL(this.objectUrl);
        this.objectUrl = undefined;
    }
}