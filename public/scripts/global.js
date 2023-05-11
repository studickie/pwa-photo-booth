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
                    }).catch(function (error) {
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
    category: 'all',
    get categories() {
        return ['all', 'photo', 'video'];
    },
    // public methods
    startup() {
        this.category = 'all';
        Data.getMedia(this.category).then(function(data) {
            const keys = Object.keys(data);
            const fragment = document.createDocumentFragment();
            while (keys.length) {
                const key = keys.shift();
                // todo: build date-group wrapper & heading & list
                const value = data[key];
                while (value.length) {
                    // todo: build list item & append to list
                    const media = value.shift();
                }
                // todo: appened all to fragment
                fragment.append();
            }
            const galleryNode = document.getElementById('gallery-view')
            galleryNode.appendChild(fragment);
            // todo: add click listener to galleryNode, implement handler
            // todo: remove loading spinner

            // assign event handlers to tabs, gallery clicks
            const categoryList = document.getElementById('gallery-tabs');
            categoryList.addEventListener('click', this.onCategoryClick);
            // todo: enable and set focus
        });
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
            const media = iteration.value;
            if (category === 'all' || category === media.type) {
                mapped[media.date] !== undefined
                    ? mapped[media.date].push(media)
                    : mapped[media.date] = [media];
            };
            iteration = iterator.next();
        }
        return mapped;
    },
    // private methods
    onCategoryClick(event) {
        const tabName = event.target.dataset.value;
        if (tabName !== Gallery.category && Gallery.categories.indexOf(tabName) > -1) {
            Gallery.category = tabName;
            const nodeList = document.getElementById('gallery-tabs').children; // li
            let iteration = 0;
            while (iteration < nodeList.length) {
                const item = nodeList.item(iteration);
                const buttonNode = item.firstElementChild;
                buttonNode.setAttribute('aria-selected', (buttonNode.dataset.value === Gallery.category));
                iteration++;
            }
        }
    },
    buildMediaTemplate(media) {
        const { type } = media;
        return `<li class="gallery-list-item ${type}"></li>`;
    }
};

const Preview = {

};

// todo: impement indexedDB storage for images, videos exist in session-memory only
// todo: on insert, first get approx. size, do not exceed 10MB
// todo: return special object that has method to return html
const Data = {
    getMedia() {
        return new Promise(function (resolve) {
            const data = {
                '05-10-2023': [{ type: 'video' }, { type: 'video' }, { type: 'photo' }, { type: 'photo' }],
                '05-09-2023': [{ type: 'video' }, { type: 'photo' }, { type: 'photo' }],
                '05-08-2023': [{ type: 'photo' }, { type: 'photo' }],
                '05-06-2023': [{ type: 'video' }, { type: 'video' }, { type: 'photo' }, { type: 'photo' }, { type: 'video' }],
                '05-04-2023': [{ type: 'video' }]
            };
            resolve(data);
        });
    }
};

const fnCompose = (fns) => {
    return (data) => {
        let acc = data;
        let i = fns.length;
        while (i > 0) {
            acc = fns[i - 1](acc);
            i--;
        }
        return acc;
    }
}

App.startup();