function withQueryOptions(fn) {
    return function queryOptions() {
        const args = arguments.slice();
        const node = args.shift();
        if (node instanceof HTMLElement) {
            return fn.apply(null, [node, ...args]);
        } else if (typeof node === 'string') {
            const queriedNode = document.getElementById(node);
            if (queriedNode) {
                return fn.apply(null, [queriedNode, ...args]);
            }
        }
        return undefined;
    }
}

const DomUtils = {
    showNode: withQueryOptions(function (node, isShown) {
        node.classList.toggle('display-none', !isShown);
        return true;
    })
};

const App = {
    startup() {
        Gallery.startup();
    },
    onDisplayGallery(event) {

    }
};

const Camera = {
    mediaType: 'photo',
    mediaCapture: undefined,
    // public methods
    startup() {
        const videoNode = document.getElementById('video-player');
        this.mediaCapture = new MediaCapture();
        this.mediaCapture.start(videoNode).then(function () {
            const mediaTypeNode = document.getElementById('media-type-radio-group');
            mediaTypeNode.addEventListener('change', Camera.onSelectMediaType);
            const captureNode = document.getElementById('button-capture');
            captureNode.addEventListener('click', Camera.onCaptureMedia);

        }).catch(function (error) {
            const { message, stack, isUserMediaError } = error;
            if (isUserMediaError) {
                // todo: display media error window
            } else {
                // todo: display generic error window
            }
            console.log(`Error - ${message}\n${stack}`);
        });
    },
    stop() {
        this.mediaCapture.stop();
        this.mediaCapture = undefined;
    },
    // event handlers
    onSelectMediaType(event) {
        const radioNode = event.target;
        if (radioNode.value !== Camera.mediaType) {
            Camera.mediaType = radioNode.value;
        }
    },
    onCaptureMedia(event) {
        switch (Camera.mediaType) {
            case 'photo':
                Gallery.addCapture(Camera.mediaCapture.capturePhoto());
                // todo: stop Camera.mediaCapture
                break;
            case 'video':
                if (Camera.mediaCapture.isRecording) {
                    // will stop automatically after X seconds, or on second button click
                    Camera.mediaCapture.captureVideoStop();
                } else {
                    Camera.mediaCapture.captureVideo().then(function (video) {
                        if (video) {
                            Gallery.addCapture(video);
                        }
                        // todo: stop Camera.mediaCapture
                    }).catch(function(error) {
                        // todo: display generic error window
                        const { message, stack } = error;
                        console.log(`Error - ${message}\n${stack}`);
                    });
                }
                break;
            default:
                console.log(`Invalid media type selected "${Camera.mediaType}"`);
        }
    }
};

const Gallery = {
    captures: new Map(),
    tab: 'all',
    // public methods
    startup() {
        // assign event handlers to tabs, gallery clicks
        const categoryList = document.getElementById('gallery-tabs');
        categoryList.addEventListener('click', this.onCategoryClick);
    },
    stop() {
        // unassign event handlers to tabs, gallery clicks
        const categoryList = document.getElementById('gallery-tabs');
        categoryList.removeEventListener('click', this.onCategoryClick);
    },
    addCapture(media) {
        this.captures.add(media.id, media);
    },
    /**
     * @param {'all'|'photo'|'video'} category
     */
    getMediaByCategory(category) {
        const mapped = {};
        const iterator = this.captures.values();
        let iteration = iterator.next();
        while (!iteration.done) {
            const item = iteration.value;
            if (category === 'all' || category === item.type) {
                mapped[item.date] !== undefined
                    ? mapped[item.date].push(item)
                    : mapped[item.date] = [item];
            };
            iteration = iterator.next();
        }
        return mapped;
    },
    // private methods
    onCategoryClick(event) {
        const tabName = event.target.dataset.value;
        if (tabName && tabName !== Gallery.tab) {
            Gallery.tab = tabName;
            const nodeList = document.getElementById('gallery-tabs').children; // li
            let iteration = 0;
            while (iteration < nodeList.length) {
                const item = nodeList.item(iteration);
                const buttonNode = item.firstElementChild;
                buttonNode.setAttribute('aria-selected', (buttonNode.dataset.value === Gallery.tab));
                iteration++;
            }
        }
    },
    buildMediaTemplate(media) {
        const { type, previewSource } = media;
        return `<li class="gallery-list-item">
            <img src=${previewSource} alt="Captured ${type}">
        </li>`;
    }
};

const Preview = {

};

App.startup();