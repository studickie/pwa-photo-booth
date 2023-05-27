const MediaCaptureStatus = {
    default: 0,
    starting: 1,
    started: 2
};

class MediaCapture {
    constructor() {
        this.status = MediaCaptureStatus.default;
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
     * @returns {Promise<void>}
     */
    start(videoNode, options) {
        this.status = MediaCaptureStatus.starting;
        this.videoNode = videoNode;

        const onSuccess = function (mediaStream) {
            this.mediaStream = mediaStream;
            this.videoNode.srcObject = this.mediaStream;
            this.videoNode.play();
            this.status = MediaCaptureStatus.started;
            return true;
        }

        return navigator.mediaDevices.getUserMedia({
            video: {
                width: {
                    max: 1920
                }
            },
            audio: {
                channelCount: 1,
                sampleRate: 44100,
                sampleSIze: 16
            }
        }).then(onSuccess.bind(this));
    }
    stop() {
        if (this.isRecording) {
            this.videoCapture.pause();
        }
        if (this.mediaStream) {
            const mediaTracks = this.mediaStream.getTracks();
            let iteration = 0;
            while (iteration < mediaTracks.length) {
                const track = mediaTracks[iteration];
                track.stop();
                iteration++;
            }
        }
        this.videoCapture = undefined;
        this.mediaStream = undefined;
        this.videoNode = undefined;
        this.status = MediaCaptureStatus.default;
    }
    /**
     * @returns {CapturedPhoto}
     */
    capturePhoto() {
        function onCapturePhoto(resolve) {
            let trackWidth = 0;
            let trackHeight = 0;
            let iteration = 0;
            const tracks = this.mediaStream.getVideoTracks();
            while (iteration < tracks.length) {
                const track = tracks[iteration];
                if (track.readyState === 'live') {
                    const settings = track.getSettings();
                    trackWidth = settings.width;
                    trackHeight = settings.height;
                    break;
                }
                iteration++;
            }

            let canvas = document.createElement('canvas');
            canvas.width = trackWidth;
            canvas.height = trackHeight;
            canvas.getContext('2d').drawImage(this.videoNode, 0, 0, canvas.width, canvas.height);
            // const dataUrl = canvas.toDataURL('image/jpeg');
            canvas.toBlob(function (blob) {
                canvas = undefined;
                const media = new CapturedPhoto(blob, trackWidth, trackHeight);
                resolve(media);
            }, 'image/jpeg');
        }
        return new Promise(onCapturePhoto.bind(this));
    }
    /**
     * @returns {Promise<CapturedVideo | null>}
     */
    captureVideo() {
        function onCapture(video) {
            this.videoCapture = undefined;
            if (video) {
                return new CapturedVideo(video);
            }
            return null;
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
            this.mimeType = 'video/mp4'; // assume iOS

        } else if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
            this.mimeType = 'video/webm'; // FireFox

        } else {
            const mimeTypes = [
                'video/mp4', // Safari, attempt first for best support
                'video/webm\;codecs=opus' // Chrome
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
    }
    get isRecording() {
        return this.mediaRecorder.state === 'recording';
    }
    /**
     * @param {MediaStream} mediaStream 
     * @returns {Promise<Blob | false>}
     */
    record(mediaStream) {
        const onRecord = function (resolve) {
            const segments = [];
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

            const onPause = function () {
                this.mediaRecorder = undefined;
                segments.length = 0;
                resolve(false);
            }

            const onStop = function () {
                const videoBlob = new Blob(segments, { type: this.mimeType });
                this.mediaRecorder = undefined;
                segments.length = 0;
                resolve(videoBlob);
            }

            this.mediaRecorder.addEventListener('dataavailable', onData.bind(this));
            this.mediaRecorder.addEventListener('pause', onPause.bind(this));
            this.mediaRecorder.addEventListener('stop', onStop.bind(this));
            this.mediaRecorder.start(1000); // dataavailable event every second
        }
        return new Promise(onRecord.bind(this));
    }
    pause() {
        // pause event used for handling interruptions, will end capture and discard video segments
        this.mediaRecorder.pause();
    }
    stop() {
        this.mediaRecorder.stop();
    }
}

class CapturedPhoto {
    /**
     * @constructor 
     * @param {Blob} data 
     * @param {Number} width 
     * @param {Height} height 
     */
    constructor(data, width, height) {
        this.data = data;
        this.width = width;
        this.height = height;
        this.timestamp = new Date().getTime();
    }
    get id() {
        return this.timestamp;
    }
    get date() {
        const date = new Date(this.timestamp);
        return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
    }
    get type() {
        return 'photo';
    }
    get size() {
        return this.data.size * Math.pow(10, -6);
    }
    get meta() {
        return [
            ['width', this.width], 
            ['height', this.height]
        ];
    }
}

class CapturedVideo {
    /**
     * @constructor 
     * @param {Blob} data
     */
    constructor(data) {
        this.data = data;
        this.timestamp = new Date().getTime();
    }
    get id() {
        return this.timestamp;
    }
    get date() {
        const date = new Date(this.timestamp);
        return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
    }
    get type() {
        return 'video';
    }
    get size() {
        return this.data.size * Math.pow(10, -6);
    }
}