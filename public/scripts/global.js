const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const SCREEN_CAMERA = 'camera';
const SCREEN_GALLERY = 'gallery';
const SCREEN_PREVIEW = 'preview';
const DB_NAME = 'photo-booth';
const DB_VERSION = 1;
const DB_GALLERY = 'gallery';
const DB_UPGRADE = function (event) {
    const db = event.target.result;
    console.log(`Upgrading to version ${db.version}`);
    db.createObjectStore(DB_STORES.gallery, { keyPath: 'id' });
}

function withQueryOptions(fn) {
    return function queryOptions() {
        const args = Array.from(arguments);
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

const mapToGalleryMedia = (storeItem) => {
    const { timestamp, data, type } = storeItem;
    return new GalleryMedia(timestamp, data, type);
};

const mapToStoredMedia = (captureItem) => {
    const { timestamp, data, type } = captureItem;
    return {
        timestamp,
    };
}

const DomUtils = {
    setDisabled: withQueryOptions(function (node, isDisabled) {
        node.disabled = !isDisabled;
        return true;
    }),
    showNode: withQueryOptions(function (node, isShown) {
        node.classList.toggle('display-none', !isShown);
        return true;
    })
};

const CustomEvent = {
    events: new Map(),
    emit(eventName, data) {
        if (this.events.has(eventName)) {
            const eventHandlers = this.events.get(eventName).values();
            let iteration = eventHandlers.next();
            while (!iteration.done) {
                const handler = iteration.value;
                handler(data);
                iteration = eventHandlers.next();
            }
        }
    },
    once(eventName, handler) {
        if (typeof handler === 'function') {
            function onceHandler(handler, data) {
                handler(data);
                this.removeListener(eventName, onceHandler);
            }
            this.addListener(eventName, onceHandler.bind(this, handler));
        }
    },
    addListener(eventName, handler) {
        if (this.events.has(eventName)) {
            this.events.get(eventName).add(handler);
        } else {
            this.events.set(eventName, new Set(handler));
        }
    },
    removeListener(eventName, handler) {
        if (this.events.has(eventName)) {
            const handlersList = this.events.get(eventName);
            handlersList.delete(handler);
            if (handlersList.size < 1) {
                this.events.delete(eventName);
            }
        }
    }
};

class GalleryItem {
    /**
    * @constructor
    * @param {Number} timestamp // index
    * @param {Blob} data 
    * @param {'photo' | 'video'} type 
    */
    constructor(timestamp, data, type) {
        this.timestamp = timestamp;
        this.data = data
        this.dataUrl = URL.createObjectURL(data);
        this.type = type;
        this.date = (d => (
            new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString()
        ))(new Date(timestamp));
    }
    revokeObjectUrl() {
        URL.revokeObjectURL(this.dataUrl);
    }
}

class StoreTransation {
    /**
     * @constructor
     * @param {IDBDatabase} conn 
     */
    constructor(conn) {
        this.conn = conn;
    }
    /**
     * @param {String} storeName
     * @returns {Promise<Record<String, any>[]>}
     */
    getItems(storeName) {
        const conn = this.conn;
        return new Promise(function transaction(resolve, reject) {
            const transaction = conn.transaction(storeName);
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onerror = function () {
                reject(request.error);
            }
            request.onsuccess = function () {
                resolve(request.result);
            }
        }).finally(function () {
            conn.close();
        });
    }
    /**
     * @param {String} storeName
     * @param {Record<String, any>} data
     * @returns {Promise<Boolean>}
     */
    addItem(storeName, data) {
        const conn = this.conn;
        return new Promise(function (resolve, reject) {
            const transaction = conn.transaction(storeName);
            const store = transaction.objectStore(storeName);
            const request = store.add(data);

            request.onerror = function () {
                reject(request.error);
            }
            request.onsuccess = function () {
                resolve(true);
            }
        }).finally(function () {
            conn.close();
        });
    }
    /**
     * @param {String} storeName
     * @param {Record<String, any>} data
     * @returns {Promise<Boolean>}
     */
    deleteItem(storeName, key) {
        const conn = this.conn;
        return new Promise(function transaction(resolve, reject) {
            const transaction = conn.transaction(storeName);
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);

            request.onerror = function () {
                reject(request.error);
            }
            request.onsuccess = function () {
                resolve(true);
            }
        }).finally(function () {
            conn.close();
        });
    }
}

const Store = {
    /**
     * @returns {Promise<Number>} approximate total storage size in Mb
     */
    estimatedSize() {
        return navigator.storage.estimate().then(function (value) {
            return value * Math.pow(10, -6);
        });
    },
    /**
     * @param {String} name
     * @param {Number} version
     * @param {(event: any) => void} onUpgrade
     * @returns {Promise<StoreTransation>}
     */
    connect(name, version, onUpgrade) {
        return new Promise(function requestConnect(resolve, reject) {
            const request = window.indexedDB.open(name, version);

            request.onerror = function () {
                reject(request.error);
            }
            request.onsuccess = function () {
                resolve(request.result);
            }
            request.onupgradeneeded = function (event) {
                if (typeof onUpgrade === 'function') {
                    onUpgrade(event);
                }
            }
        }).then(function(conn) {
            return new StoreTransation(conn);
        });
    }
}

const App = {
    screen: SCREEN_GALLERY,
    mediaCapture: undefined,
    get maxStorage() {
        return 10; // 10Mb for all app files and persisted images
    },
    startup() {
        this.mediaCapture = new MediaCapture();

        Store.connect(DB_NAME, DB_VERSION, DB_UPGRADE).then(function (conn) {
            conn.getItems(DB_GALLERY).then(function (results) {
                // todo: map to gallery items
                // ? is gallery the 'landing screen'?
                // todo: hide loading spinner and show gallery
            });
        });
    },
    onClickHandler(event) {
        const eventId = event.target.id;
        switch (eventId) {
            case 'button-capture':
                App.onCapture();
                break;
            case 'button-open-gallery':
                if (App.screen === SCREEN_CAMERA) {
                    DomUtils.showNode('screen-camera', false);
                    App.mediaCapture.stop();
                }
                App.screen = SCREEN_GALLERY;
                DomUtils.showNode('screen-gallery', true);
                break;
            case 'button-open-camera':
                if (App.screen === SCREEN_GALLERY) {
                    DomUtils.showNode('screen-gallery', false);
                }
                App.screen = SCREEN_CAMERA;
                DomUtils.showNode('screen-camera', true);
                App.mediaCapture.start(document.getElementById('video-player'))
                    .catch(function (error) {
                        if (error.name === 'NotAllowedError') {
                            // todo: display media error screen
                        } else {
                            // todo: display generic error screen
                        }
                        console.log(`Error - ${error.message}`);
                    });
                break;
        }
    },
    async onCapture() {
        try {
            const { id, size, timestamp, data, type, width, height } = App.mediaCapture.capturePhoto();
            const storageSize = await Store.estimatedSize();
            if ((storageSize + media.size) < App.maxStorage) {
                const conn = await Store.connect(DB_NAME, DB_VERSION);
                await conn.addItem(DB_GALLERY, { id, size, timestamp, data, type, width, height });
            } else {
                // todo: notify user that image will not be saved
            }
            // todo: create GalleryItem and add to gallery
        } catch (error) {

        }
    }
};

const Camera = {
    mediaCapture: undefined,
    // public methods
    start() {
        const videoNode = document.getElementById('video-player');
        this.mediaCapture = new MediaCapture();
        this.mediaCapture.start(videoNode).catch(function (error) {
            if (error.name === 'NotAllowedError') {
                // todo: display media error screen
            } else {
                // todo: display generic error screen
            }
            console.log(`Error - ${error.message}`);
        });
    },
    stop() {
        this.mediaCapture.stop();
        this.mediaCapture = undefined;
    },
    capture() {
        switch (Camera.mediaType) {
            case 'photo':
                this.mediaCapture.capturePhoto().then(function (capturedPhoto) {
                    CustomEvent.emit('onCapture', capturedPhoto);
                }).catch(function (error) {
                    // todo: display generic error to user
                    const { message, stack } = error;
                    console.log(`Error - ${message}\n${stack}`);
                });
                break;
            // case 'video':
            //     if (this.mediaCapture.isRecording) {
            //         // will stop automatically after X seconds, or on second button click
            //         this.mediaCapture.captureVideoStop();
            //     } else {
            //         this.mediaCapture.captureVideo().then(function (video) {
            //             if (video) {
            //                 Gallery.addCapture(video);
            //             }
            //             // todo: stop Camera.mediaCapture
            //         }).catch(function (error) {
            //             // todo: display generic error window
            //             const { message, stack } = error;
            //             console.log(`Error - ${message}\n${stack}`);
            //         });
            //     }
            //     break;
            default:
                console.log(`Invalid media type selected "${Camera.mediaType}"`);
        }
    }
};

const Gallery = {
    media: new Set(),
    // public methods
    startup() {
        // this.category = 'all';
        // Store.getMedia(this.category).then(function (data) {
        //     const dataSorted = data.sort((a, b) => {
        //         return new Date(a.date).getTime() > new Date(b.date).getTime() ? -1 : 1;
        //     });
        //     while (dataSorted.length) {
        //         const { type, date } = dataSorted.shift();
        //         Gallery.media.add({ type, date });
        //         // Gallery.media.add(new GalleryMedia('', type, date));
        //     }
        //     Gallery.render();
        //     // todo: hide loading spinner
        // });
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
    // buildGalleryGroup(heading) {
    //     const h = document.createElement('h2');
    //     h.textContent = heading;
    //     const div = document.createElement('div');
    //     div.classList = 'gallery-group';
    //     div.appendChild(h);
    //     return div;
    // },
    // buildGalleryList() {
    //     const ul = document.createElement('ul');
    //     ul.classList = 'gallery-list';
    //     return ul;
    // },
    buildGalleryListItem(src) {
        const li = document.createElement('li');
        li.classList = 'gallery-list-item';
        return li;
    }
};

const Preview = {

};

const ConfirmDialog = {
    /**
     * @returns {Promise<void>}
     */
    requestAction() {

    },
    onClickHandler(event) {

    },
    onKeypressHandler(event) {

    }
};

App.startup();
document.addEventListener('click', App.onClickHandler);