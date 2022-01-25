const PhotoBooth = {
    _env: undefined,
    _onCaptureCallback: null,
    _mediaType: "photo",
    _mediaStream: null,
    _mimeType: "",
    _video: {
        maxLength: 30,
        mediaRecorder: null,
        isRecording: false,
        segments: []
    },
    _screen: {
        width: 0,
        height: 0
    },
    _videoEl: null,
    _canvas: null,
    /**
    * @param {Record<"photo" | "video" | "onCapture", any>} config 
    * 
    * @description start-up image/video capture feature
    */
    async startup(config) {
        try {
            if (!config || (!config.photo && !config.video) || !config.onCapture) {
                throw new TypeError("[ERROR]: Invalid configuration");

            } else {
                this._env = config.env || "production";

                /* init video stream element, capture button, MIME type (in case of video); crucial app elements, if not found throw error
                */
                this._videoEl = document.getElementById("video-player");

                if (!this._videoEl) {
                    throw new ReferenceError("[ERROR]: No video element found");
                }

                const captureEl = document.getElementById("capture-media");

                if (!captureEl) {
                    throw new ReferenceError("[ERROR]: Capture button not found");
                }

                if (config.video === true) {
                    this._configureMimeType();
                }

                /* request media permissions, configure camera, microphone
                */
                const hasMediaStream = await this._configureUserMedia();

                if (hasMediaStream) {
                    /* set-up event listeners; wait until user media is configured before setting up UI events
                    - capture button
                    - media seletor
                    */
                    captureEl.addEventListener("click", this._onCaptureMediaHandler.bind(this));
                    captureEl.disabled = false;

                    if (!config.photo || !config.video) {
                        this._mediaType = config.photo === true
                            ? "photo"
                            : "video";

                    } else {
                        const mediaOptionsEl = document.getElementById("media-options");

                        if (mediaOptionsEl) {
                            mediaOptionsEl.classList.remove("hidden");
                            mediaOptionsEl.addEventListener("change", this._onSelectMediaTypeHandler.bind(this));
                        }
                    }

                    /* other state setup
                    */
                    this._onCaptureCallback = config.onCapture;
                    this._canvas = document.createElement("canvas");

                    this._screen.width = document.body.clientWidth;
                    this._screen.height = document.body.clientHeight;

                    window.addEventListener("resize", this._onResizeHandler.bind(this));
                }
            }

        } catch (error) {
            this._displayGenericError(true);

            console.log(error);

            if (this._env === "debug") {
                alert(error);
            }
        }
    },
    stop() {
        this._mediaStream.getTracks().forEach(function(track) {
            track.stop();
        });

        this._setMediaSelectorsDisabledStatus(true);

        /* clear state of objects that might prevent this from being GC'ed */
        this._onCaptureCallback = null;
        this._mediaStream = null;
        this._videoEl = null;
        this._canvas = null;
        this._video.mediaRecorder = null;
        this._video.segments = [];
        
        // TODO: remove event listeners, other bindings
    },
    _configureMimeType() {
        if (!window.MediaSource) {
            /*
                TIP: iOS Safari does not support the MediaSource class, and is the only browser not to do so.
                Detecting a lack of window.MediaSource can be used to identify the browser as iOS Safari.
            */
            this._mimeType = "video/mp4";

        } else {
            const mimeTypes = [
                "video/webm",
                "video/webm\;codecs=opus",
                "video/mp4"
            ];

            for (let i = 0; i < mimeTypes.length; i++) {
                /*
                    TIP: MediaSource class is still marked as experimental, as is its isTypeSupported static method;
                    the results may not always be accurate. 
                */
                if (MediaSource.isTypeSupported(mimeTypes[i]) === true) {
                    this._mimeType = mimeTypes[i];
                    break;
                }
            }
        }

        if (!this._mimeType) {
            throw new TypeError("[ERROR]: Invalid MIME type ".concat("\"", this._mimeType, "\""));
        }
    },
    async _configureUserMedia() {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    aspectRatio: 1.33,
                    facingMode: "user",
                    frameRate: 30,
                    width: {
                        min: 960,
                        max: 1280
                    }
                },
                audio: {
                    channelCount: 1,
                    sampleRate: 44100,
                    sampleSize: 16
                }
            });

            /* begin stream
            */
            this._mediaStream = mediaStream;
            this._videoEl.srcObject = this._mediaStream;
            this._videoEl.play();

            if (this._env === "debug") {
                mediaStream.getTracks().forEach(function(track){
                    const settings = track.getSettings();
                    if (settings.aspectRatio) {
                        alert(`
                            deviceId: ${settings.deviceId}
                            resolution: ${settings.width} x ${settings.height}
                            framerate: ${settings.frameRate}
                        `);
                    }
                });
            }

            return true;

        } catch (error) {
            console.log("[ERROR]: getUserMedia: ", error);

            this._displayUserMediaError(true);

            return false;
        }
    },
    /**
     * @param {Boolean} isDisabled 
     */
    _setMediaSelectorsDisabledStatus(isDisabled) {
        const selectorList = document.getElementsByName("media-option");

        for (let i = 0; i < selectorList.length; i++) {
            selectorList[i].disabled = isDisabled;
        }
    },
    /**
     * @param {"start" | "stop"} showButton 
     */
    _displayCaptureButtonAs(showButton) {
        const captureEl = document.getElementById("capture-media");

        if (captureEl) {
            const toggle = showButton === "start";

            captureEl.classList.toggle("start", toggle);
            captureEl.classList.toggle("stop", !toggle);
        }
    },
    /**
     * @param {Boolean} isShown 
     * @param {Boolean | undefined} isRecording 
     * @param {Number | undefined} displayTime 
     */
    _displayRecordingCountdown(isShown, isRecording, displayTime) {
        const countdownEl = document.getElementById("video-countdown");

        if (countdownEl) {
            countdownEl.innerHTML = "";

            if (isShown && !isNaN(displayTime)) {
                /* TIP: this formatting works so long as displayTime is less than 60 seconds */
                const formattedTime = "0:".concat(displayTime.toString().padStart(2, "0"));

                const span = document.createElement("span");
                span.classList = isRecording
                    ? "recording"
                    : "";
                span.textContent = formattedTime;

                countdownEl.appendChild(span);
            }
        }
    },
    /**
     * @param {Boolean} hasError 
     */
    _displayUserMediaError(hasError) {
        /* set display error
        */
        const mediaEl = document.getElementById("user-media-display");

        if (mediaEl) {
            mediaEl.classList.toggle("show-error-user-media", hasError);
        }

        /* set capture button disabled status
        */
        const captureEl = document.getElementById("capture-media");

        if (captureEl) {
            captureEl.disabled = hasError;
        }
    },
    /**
     * @param {Boolean} hasError 
     */
    _displayGenericError(hasError) {
        /* set display error
                    */
        const mediaEl = document.getElementById("user-media-display");

        if (mediaEl) {
            mediaEl.classList.toggle("show-error-generic", hasError);
        }

        /* set capture button disabled status
        */
        const captureEl = document.getElementById("capture-media");

        if (captureEl) {
            captureEl.disabled = hasError;
        }
    },
    _capturePhoto() {
        const boundingRects = this._videoEl.getBoundingClientRect();
        this._canvas.width = boundingRects.width;
        this._canvas.height = boundingRects.height;

        this._canvas.getContext("2d").drawImage(
            this._videoEl,
            0,
            0,
            this._canvas.width,
            this._canvas.height
        );

        const dataUrl = this._canvas.toDataURL("image./png");
        const capturedImage = new CapturedImage(dataUrl, this._canvas.width, this._canvas.height);
        this._onCaptureCallback(capturedImage);
    },
    _captureVideo() {
        if (this._video.isRecording) {
            this._video.mediaRecorder.stop();

        } else {
            this._video.mediaRecorder = new MediaRecorder(this._mediaStream, {
                audioBitsPerSecond: 128000,
                videoBitsPerSecond: 5000000,
                mimeType: this._mimeType
            });

            this._video.mediaRecorder.addEventListener("dataavailable", (function (event) {
                this._video.segments.push(event.data);

                if (this._video.mediaRecorder.state === "recording") {

                    if (this._video.maxLength > this._video.segments.length) {
                        this._displayRecordingCountdown(
                            true,
                            true,
                            this._video.maxLength - this._video.segments.length
                        );

                    } else {
                        this._video.mediaRecorder.stop();
                    }
                }
            }).bind(this));

            this._video.mediaRecorder.addEventListener("stop", (function () {
                const videoBlob = new Blob(this._video.segments, {
                    type: this._mimeType
                });

                if (this._env === "debug") {
                    alert("Video size: " + videoBlob.size * 0.000001 + " MB");
                }

                const capturedVideo = new CapturedVideo(videoBlob);
                this._onCaptureCallback(capturedVideo);

                /* reset UI */
                this._displayCaptureButtonAs("start");
                this._displayRecordingCountdown(false);
                this._setMediaSelectorsDisabledStatus(false);

                /* clean-up state */
                this._video.isRecording = false;
                this._video.segments = [];
                this._video.mediaRecorder = null;

            }).bind(this));

            this._video.mediaRecorder.start(1000);

            /* set recording state */
            this._video.isRecording = true;

            /* set recording UI */
            this._displayCaptureButtonAs("stop");
            this._displayRecordingCountdown(true, true, this._video.maxLength);
            this._setMediaSelectorsDisabledStatus(true);
        }
    },
    _onResizeHandler() {
        const screenWidth = document.body.clientWidth;
        const screenHeight = document.body.clientHeight;

        /*
            TIP: on mobile phones, resize event is fired when a user action, such as a scroll, 
            causes browser UI elements to be hidden; prevent constant calls to resize by comparing
            previous and current document sizes
        */
        if (this._screen.width !== screenWidth && this._screen.height !== screenHeight) {
            this._screen.width = screenWidth;
            this._screen.height = screenHeight;

            this._configureUserMedia();
        }
    },
    _onSelectMediaTypeHandler(event) {
        const mediaType = event.target.dataset.mediaOption;

        if (mediaType && !this._videoIsRecording) {
            this._mediaType = mediaType;

        } else {
            return false;
        }
    },
    _onCaptureMediaHandler() {
        switch (this._mediaType) {
            case "photo":
                this._capturePhoto();
                break;
            case "video":
                this._captureVideo();
                break;
            default:
                console.log("Unsupported media capture type selected");
        }
    }
};

/**
 * @constructor
 * @param {String} imageUrl
 * 
 * @hidden
 * Should implement "Captured Media" interface
 */
class CapturedImage {
    constructor(imageUrl, width, height) {
        this._imageUrl = imageUrl;
        this._imageWidth = width;
        this._imageHeight = height;
    }

    /* Captured Media interface methods
    */
    get type() {
        return "photo";
    }

    get previewSource() {
        return this._imageUrl;
    }

    get dataSource() {
        return this._imageUrl;
    }

    /* Captured Image interface methods
    */

    get width() {
        return this._imageWidth;
    }

    get height() {
        return this._imageHeight;
    }
}

/**
 * @constructor
 * @param {Blob} videoBlob
 * 
 * @hidden
 * Should implement "Captured Media" interface
 */
class CapturedVideo {
    constructor(videoBlob) {
        this._videoBlob = videoBlob;
        this._videoObjectUrl = URL.createObjectURL(videoBlob);
    }

    /* Captured Media interface methods
    */
    get type() {
        return "video";
    }

    get previewSource() {
        return this._videoObjectUrl;
    }

    get dataSource() {
        return this._videoBlob;
    }

    /* Captured Video interface methods
    */
    releaseObjectUrl() {
        URL.revokeObjectURL(this._videoObjectUrl);
        this._videoObjectUrl = "";
    }
}

const Gallery = {
    /**
     * @param {String} imageUrl 
     */
    appendImage(imageUrl) {
        const galleryEl = document.getElementById("gallery-list");

        if (galleryEl) {
            const listItem = document.createElement("li");

            const image = document.createElement("img");
            image.src = imageUrl;

            listItem.appendChild(image);

            galleryEl.appendChild(listItem);
        }
    },
    /**
     * @param {String} videoUrl 
     */
    appendVideo(videoUrl) {
        const galleryEl = document.getElementById("gallery-list");

        if (galleryEl) {
            const listItem = document.createElement("li");

            const video = document.createElement("video");
            video.src = videoUrl;
            video.setAttribute("controls", "true");

            listItem.appendChild(video);

            galleryEl.appendChild(listItem);
        }
    }
};

window.addEventListener("load", function () {
    PhotoBooth.startup({
        photo: true,
        video: true,
        onCapture: function (capturedMedia) {
            switch (capturedMedia.type) {
                case "photo":
                    Gallery.appendImage(capturedMedia.previewSource);
                    break;
                case "video":
                    Gallery.appendVideo(capturedMedia.previewSource);
                    break;
                default:
                    console.log("Unsupported media type \"" + capturedMedia.type + "\"");
            }
        }
    });
});
