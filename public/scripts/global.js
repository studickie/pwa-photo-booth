const Page = {
    mediaType: 'image',
    mediaCapture: undefined,
    startup() {
        try {
            const videoNode = document.getElementById('video-player');
            this.mediaCapture = new MediaCapture();
            this.mediaCapture.start(videoNode).then(function() {
                const mediaTypeNode = document.getElementById('media-type-radio-group');
                mediaTypeNode.addEventListener('change', Page.onSelectMediaType);

                const captureNode = document.getElementById('button-capture');
                captureNode.addEventListener('click', Page.onCaptureMedia);
            });
        } catch (error) {
            // todo: display error to user
            const { message, stack } = error;
            console.log(`Error - ${message}\n${stack}`);
        }
    },
    onSelectMediaType(event) {
        const radioNode = event.target;
        if (radioNode.value !== Page.mediaType) {
            Page.mediaType = radioNode.value;
        }
    },
    onCaptureMedia(event) {
        switch(Page.mediaType) {
            case 'image':
                Page.mediaCapture.captureImage().then(function(image) {
                    console.log('snapped image');
                });
                break;
            case 'video':
                if (Page.mediaCapture.isRecording) {
                    Page.mediaCapture.captureVideoStop();
                } else {
                    Page.mediaCapture.captureVideo().then(function(video) {
                        console.log('captured video');
                    });
                }
                break;
            default: 
                console.log(`Invalid media type selected "${Page.mediaType}"`);
        }
    }
};

Page.startup();