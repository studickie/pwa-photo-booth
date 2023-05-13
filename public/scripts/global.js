const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

class GalleryMedia {
    /**
    * @constructor
    * @param {String} dataUrl 
    * @param {'photo' | 'video'} mediaType 
    * @param {String} createdOn ISO date string
    */
    constructor(dataUrl, mediaType, createdOn) {
        this.dataUrl = dataUrl;
        this.type = mediaType;
        this.date = createdOn;
    }
}

// todo: impement indexedDB storage for images, videos exist in session-memory only
// todo: on insert, first get approx. size, do not exceed 10MB
// todo: return special object that has method to return html
const Store = {
    getMedia() {
        return new Promise(function (resolve) {
            const data = [
                { type: 'video', date: '05-03-2023' },
                { type: 'video', date: '05-03-2023' },
                { type: 'photo', date: '05-03-2023' },
                { type: 'photo', date: '05-03-2023' },
                { type: 'video', date: '05-05-2023' },
                { type: 'photo', date: '05-05-2023' },
                { type: 'photo', date: '05-05-2023' },
                { type: 'photo', date: '05-06-2023' },
                { type: 'photo', date: '05-06-2023' },
                { type: 'video', date: '05-09-2023' },
                { type: 'video', date: '05-09-2023' },
                { type: 'photo', date: '05-10-2023' },
                { type: 'photo', date: '05-10-2023' },
                { type: 'video', date: '05-11-2023' },
                { type: 'video', date: '05-12-2023' }
            ];
            resolve(data);
        });
    }
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
    media: new Set(),
    category: 'all', // 'all' | 'photo' | 'video'
    get categories() {
        return ['all', 'photo', 'video'];
    },
    // public methods
    startup() {
        this.category = 'all';
        Store.getMedia(this.category).then(function (data) {
            const dataSorted = data.sort((a, b) => {
                return new Date(a.date).getTime() > new Date(b.date).getTime() ? -1 : 1;
            });
            while (dataSorted.length) {
                const { type, date } = dataSorted.shift();
                Gallery.media.add({ type, date });
                // Gallery.media.add(new GalleryMedia('', type, date));
            }
            Gallery.render();
            // todo: hide loading spinner
        });
    },
    render() {
        const fragment = document.createDocumentFragment();
        const iterator = Gallery.media.values();
        let iteration = iterator.next();
        while (!iteration.done) {
            const media = iteration.value;
            const node = Gallery.buildGalleryListItem();
            fragment.append(node);
            iteration = iterator.next();
        }
            const parentNode = document.getElementById('gallery-list');
            parentNode.innerHTML = '';
            parentNode.appendChild(fragment);
    },
    // render() {
    //     const mapped = {};
    //     const iterator = this.media.values();
    //     let iteration = iterator.next();
    //     while (!iteration.done) {
    //         const media = iteration.value;
    //         if (this.category === 'all' || this.category === media.type) {
    //             !mapped[media.date] && (mapped[media.date] = this.buildGalleryList());
    //             mapped[media.date].appendChild(this.buildGalleryListItem())
    //         };
    //         iteration = iterator.next();
    //     }
    //     const mappedKeys = Object.keys(mapped).sort((a, b) => {
    //         // descending order
    //         return new Date(a.date).getTime() > new Date(b.date).getTime() ? -1 : 1;
    //     })
    //     const fragment = document.createDocumentFragment();
    //     while (mappedKeys.length) {
    //         const key = mappedKeys.shift(); // most recent first
    //         const value = mapped[key];
    //         const date = new Date(key);
    //         const dateHeading = `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
    //         const wrapper = this.buildGalleryGroup(dateHeading);
    //         wrapper.appendChild(value);
    //         fragment.append(wrapper);
    //     }
    //     const parentNode = document.getElementById('gallery-view');
    //     parentNode.innerHTML = '';
    //     parentNode.appendChild(fragment);
    // },
    // private methods
    buildGalleryGroup(heading) {
        const h = document.createElement('h2');
        h.textContent = heading;
        const div = document.createElement('div');
        div.classList = 'gallery-group';
        div.appendChild(h);
        return div;
    },
    buildGalleryList() {
        const ul = document.createElement('ul');
        ul.classList = 'gallery-list';
        return ul;
    },
    buildGalleryListItem(src) {
        const li = document.createElement('li');
        li.classList = 'gallery-list-item';
        return li;
    }
};

const Preview = {

};

App.startup();