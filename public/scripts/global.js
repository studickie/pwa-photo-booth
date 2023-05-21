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
    db.createObjectStore(DB_GALLERY, { keyPath: 'id' });
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

class GalleryMedia {
    /**
    * @constructor
    * @param {Number} id 
    * @param {Blob} data 
    * @param {String} date ISO date string
    * @param {'photo' | 'video'} type 
    */
    constructor(id, data, date, type) {
        this.id = id;
        this.data = URL.createObjectURL(data);
        this.type = type;
        this.date = date;
    }
    get preview() {
        return this.data;
    }
    revokeObjectUrl() {
        URL.revokeObjectURL(this.data);
    }
}

class StoreTransaction {
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
            const transaction = conn.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onerror = function () {
                reject(request.error);
            }
            request.onsuccess = function () {
                resolve(request.result);
            }
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
            const transaction = conn.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);

            request.onerror = function () {
                reject(request.error);
            }
            request.onsuccess = function () {
                resolve(true);
            }
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
            const transaction = conn.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);

            request.onerror = function () {
                reject(request.error);
            }
            request.onsuccess = function () {
                resolve(true);
            }
        });
    }
}

class Store {
    /**
     * @static
     * @returns {Number}
     */
    static get maxStorage() {
        return 10; // 10Mb for all app files and persisted images
    }
    /**
     * @static
     * @returns {Promise<Record<'quota'|'usage', Number>} 'usage' is size in Mb
     */
    static details() {
        return navigator.storage.estimate().then(function (result) {
            const { usage, quota } = result;
            return { 
                quota: (quota * Math.pow(10, -6)), 
                usage: (usage * Math.pow(10, -6)) 
            };
        });
    }
    /**
     * @static
     * @param {String} name
     * @param {Number} version
     * @param {(event: any) => void} onUpgrade
     * @returns {Promise<StoreTransaction>}
     */
    static connect(name, version, onUpgrade) {
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
        }).then(function (conn) {
            return new StoreTransaction(conn);
        });
    }
}

const App = {
    screen: SCREEN_GALLERY,
    mediaCapture: undefined,
    _media: new Map(),
    set media(mediaList) {
        this._media.clear();
        let iteration = 0;
        while (iteration < mediaList.length) {
            const { id, date, data, type } = mediaList[iteration];
            this._media.set(id, new GalleryMedia(id, data, date, type));
            iteration++;
        }
    },
    get media() {
        return Array.from(this._media.values());
    },
    addMediaItem(mediaItem) {
        const { id, date, data, type } = mediaItem;
        this._media.set(id, new GalleryMedia(id, data, date, type));
        return true;
    },
    getMediaItem(itemId) {
        itemId = typeof itemId !== 'number' ? parseInt(itemId) : itemId;
        return this._media.has(itemId) ? this._media.get(itemId) : null;
    },
    deleteMediaItem(itemId) {
        itemId = typeof itemId !== 'number' ? parseInt(itemId) : itemId;
        if (this._media.has(itemId)) {
            const media = this._media.get(itemId);
            this._media.delete(itemId);
            media.revokeObjectUrl();
            media = undefined;
        }
        return true;
    },
    startup() {
        this.mediaCapture = new MediaCapture();

        Store.connect(DB_NAME, DB_VERSION, DB_UPGRADE).then(function (conn) {
            conn.getItems(DB_GALLERY).then(function (results) {
                App.media = results;
                Gallery.render(App.media);
                // todo: map to gallery items
                // ? is gallery the 'landing screen'?
                // todo: hide loading spinner and show gallery
            });
        });

        const appNode = document.getElementById('capture-app');
        appNode.addEventListener('click', this.onClickHandler);
    },
    /**
     * @param {MouseEvent} event 
     */
    onClickHandler(event) {
        const eventId = event.target.dataset.eventId;
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
            case 'anchor-open-preview':
                event.preventDefault();
                if (App.screen === SCREEN_GALLERY) {
                    DomUtils.showNode('screen-gallery', false);
                }
                App.screen = SCREEN_PREVIEW;
                Preview.render(event.target.dataset.id);
                DomUtils.showNode('screen-preview', true);
                break;
            case 'button-close-preview':
                DomUtils.showNode('screen-preview', false);
                Preview.render(false);
                App.screen = SCREEN_GALLERY;
                DomUtils.showNode('screen-gallery', true);
                break;
            case 'button-delete-media':
                break;
        }
    },
    async onCapture() {
        try {
            const media = await App.mediaCapture.capturePhoto();
            const { quota, usage } = await Store.details();
            if (usage < quota && (usage + media.size) < Store.maxStorage) {
                const { id, data, date, type } = media;
                const conn = await Store.connect(DB_NAME, DB_VERSION);
                await conn.addItem(DB_GALLERY, { id, date, data, type });
            } else {
                // todo: notify user that image will not be saved
            }
            App.addMediaItem(media);
            Gallery.render(App.media);
        } catch (error) {

        }
    }
};

const Gallery = {
    render(mediaList) {
        const fragment = document.createDocumentFragment();
        let iteration = 0;
        while (iteration < mediaList.length) {
            const { id, preview } = mediaList[iteration];
            const node = this.buildGalleryListItem(id, preview, id);
            fragment.append(node);
            iteration++;
        }
        const parentNode = document.getElementById('gallery-list');
        parentNode.innerHTML = '';
        parentNode.appendChild(fragment);
    },
    buildGalleryListItem(id, src) {
        const span = document.createElement('span');
        span.setAttribute('style', `background-image:url('${src}');`);
        span.setAttribute('role', 'presentation');

        const atag = document.createElement('a');
        atag.href = '#';
        atag.dataset.id = id;
        atag.dataset.eventId = 'anchor-open-preview';
        
        const li = document.createElement('li');
        li.id = id;
        li.classList = 'gallery-list-item';
        li.appendChild(atag);
        li.appendChild(span);

        return li;
    }
    
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
    
};

const Preview = {
    previewId: undefined,
    render(itemId) {
        const node = document.getElementById('preview-view');
        node.innerHTML = '';
        if (itemId) {
            const { id, preview } = App.getMediaItem(itemId);
            const previewNode = this.buildPreviewItem(id, preview);
            node.appendChild(previewNode);
        }
    },
    buildPreviewItem(id, src) {
        const img = document.createElement('img');
        img.src = src;
        img.setAttribute('role', 'presentation');
        return img;
    }
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