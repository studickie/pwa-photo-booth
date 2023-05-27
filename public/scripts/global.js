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
        node.disabled = isDisabled;
        return true;
    }),
    setDisplay: withQueryOptions(function (node, isShown) {
        node.classList.toggle('display-none', !isShown);
        return true;
    }),
    setFocus: withQueryOptions(function (node) {
        node.focus();
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
            function onceHandler(data) {
                handler(data);
                CustomEvent.removeListener(eventName, onceHandler);
            }
            this.addListener(eventName, onceHandler);
        }
    },
    addListener(eventName, handler) {
        if (this.events.has(eventName)) {
            this.events.get(eventName).add(handler);
        } else {
            this.events.set(eventName, new Set([handler]));
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
    close() {
        this.conn.close();
    }
}

const Store = {
    /**
     * @returns {Number}
     */
    get maxStorage() {
        return 10; // 10Mb for all app files and persisted images
    },
    /**
     * @returns {Promise<Record<'quota'|'usage', Number>} 'usage' is size in Mb
     */
    details() {
        return navigator.storage.estimate().then(function (result) {
            const { usage, quota } = result;
            return {
                quota: (quota * Math.pow(10, -6)),
                usage: (usage * Math.pow(10, -6))
            };
        });
    },
    /**
     * @param {String} name
     * @param {Number} version
     * @param {(event: any) => void} onUpgrade
     * @returns {Promise<StoreTransaction>}
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
        }).then(function (conn) {
            return new StoreTransaction(conn);
        });
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

const Gallery = {
    _media: new Map(),
    set media(mediaList) {
        this._media.clear();
        let iteration = 0;
        while (iteration < mediaList.length) {
            const { id, date, data, type } = mediaList[iteration];
            this._media.set(id, new GalleryMedia(id, data, date, type));
            iteration++;
        }
        CustomEvent.emit('galleryUpdate');
    },
    getItem(itemId) {
        if (typeof itemId !== 'number') {
            itemId = parseInt(itemId);
        };
        return this._media.has(itemId) ? this._media.get(itemId) : null;
    },
    addItem(mediaItem) {
        const { id, date, data, type } = mediaItem;
        this._media.set(id, new GalleryMedia(id, data, date, type));
        CustomEvent.emit('galleryUpdate');
        return true;
    },
    deleteItem(itemId) {
        itemId = typeof itemId !== 'number' ? parseInt(itemId) : itemId;
        if (this._media.has(itemId)) {
            let media = this._media.get(itemId);
            this._media.delete(itemId);
            media.revokeObjectUrl();
            media = undefined;
            CustomEvent.emit('galleryUpdate');
        }
        return true;
    },
    buildListImages() {
        const fragment = document.createDocumentFragment();
        const list = this._media.values();
        let iteration = list.next();
        while (!iteration.done) {
            const { preview, id } = iteration.value;
            // image
            const span = document.createElement('span');
            span.setAttribute('style', `background-image:url('${preview}');`);
            span.setAttribute('role', 'presentation');
            // open-preview
            const atag = document.createElement('a');
            atag.href = '#';
            atag.dataset.id = id;
            atag.dataset.eventId = 'anchor-open-preview';
            // container
            const li = document.createElement('li');
            li.id = id;
            li.classList = 'gallery-list-item';
            li.appendChild(atag);
            li.appendChild(span);
            fragment.append(li);

            iteration = list.next();
        }
        return fragment;
    },
    buildPreviewImage(itemId) {
        if (typeof itemId !== 'number') {
            itemId = parseInt(itemId);
        }
        if (this._media.has(itemId)) {
            const { preview, id } = this._media.get(itemId);
            const img = document.createElement('img');
            img.src = preview;
            img.setAttribute('role', 'presentation');
            return img;
        } else {
            return undefined;
        }
    }
};

const App = {
    screen: SCREEN_GALLERY,
    previewId: undefined,
    mediaCapture: undefined,
    startup() {
        this.mediaCapture = new MediaCapture();

        Store.connect(DB_NAME, DB_VERSION, DB_UPGRADE).then(function (conn) {
            conn.getItems(DB_GALLERY).then(function (results) {
                Gallery.media = results;
                // todo: map to gallery items
                // ? is gallery the 'landing screen'?
                // todo: hide loading spinner and show gallery
            }).finally(function () {
                conn.close();
            });
        });

        CustomEvent.addListener('galleryUpdate', App.renderListImages);
        const appNode = document.getElementById('capture-app');
        appNode.addEventListener('click', this.onClickHandler);
    },
    renderListImages() {
        const fragment = Gallery.buildListImages();
        const node = document.getElementById('gallery-list');
        node.innerHTML = '';
        node.appendChild(fragment);
    },
    renderPreviewImage(itemId) {
        const previewNode = Gallery.buildPreviewImage(itemId);
        const node = document.getElementById('preview-view');
        node.innerHTML = '';
        node.appendChild(previewNode);
    },
    resetPreview() {
        const node = document.getElementById('preview-view');
        node.innerHTML = '';
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
                    DomUtils.setDisabled('button-capture', true);
                    DomUtils.setDisplay('screen-camera', false);
                    if (App.mediaCapture.status === MediaCaptureStatus.starting) {
                        CustomEvent.once('cameraStart', function() {
                            App.mediaCapture.stop();
                        });
                    } else {
                        App.mediaCapture.stop();
                    }
                }
                App.showGallery();
                break;
            case 'button-open-camera':
                event.preventDefault();
                if (App.screen === SCREEN_GALLERY) {
                    DomUtils.setDisplay('screen-gallery', false);
                }
                App.showCamera();
                break;
            case 'anchor-open-preview':
                event.preventDefault();
                if (App.screen === SCREEN_GALLERY) {
                    DomUtils.setDisplay('screen-gallery', false);
                }
                App.showPreview(event.target.dataset.id);
                break;
            case 'button-close-preview':
                DomUtils.setDisplay('screen-preview', false);
                App.resetPreview();
                App.screen = SCREEN_GALLERY;
                DomUtils.setDisplay('screen-gallery', true);
                break;
            case 'button-delete-media':
                App.onDeleteMedia(event.target);
                break;
        }
    },
    onCapture() {
        App.mediaCapture.capturePhoto().then(function (media) {
            Store.details().then(function (details) {
                const { quota, usage } = details;
                if (usage < quota && (usage + media.size) < Store.maxStorage) {
                    const { id, data, date, type } = media;
                    Store.connect(DB_NAME, DB_VERSION).then(function (conn) {
                        conn.addItem(DB_GALLERY, { id, date, data, type });
                    });
                    Gallery.addItem(media);
                } else {
                    // todo: notify user that image will not be saved
                }
            });
        });
    },
    onDeleteMedia() {
        ConfirmDialog.requestAction().then(function (isConfirmed) {
            if (isConfirmed) {
                Store.connect(DB_NAME, DB_VERSION).then(function (conn) {
                    conn.deleteItem(DB_GALLERY, App.previewId).then(function () {
                        Gallery.deleteItem(App.previewId);

                        DomUtils.setDisplay('screen-preview', false);
                        App.resetPreview();
                        App.screen = SCREEN_GALLERY;
                        DomUtils.setDisplay('screen-gallery', true);
                        DomUtils.setFocus(document.getElementById('gallery-list').firstElementChild);
                    }).finally(function () {
                        conn.close();
                    });
                });
            } else {
                DomUtils.setFocus('button-delete-media');
            }
        });
    },
    // UI operations
    showGallery() {
        this.screen = SCREEN_GALLERY;
        DomUtils.setDisplay('screen-gallery', true);
    },
    showCamera() {
        this.screen = SCREEN_CAMERA;
        DomUtils.setDisplay('screen-camera', true);
        this.mediaCapture.start(document.getElementById('video-player')).then(function () {
            DomUtils.setDisabled('button-capture', false);
            CustomEvent.emit('cameraStart');
        }).catch(function (error) {
            if (error.name === 'NotAllowedError') {
                // todo: display media error screen
            } else {
                // todo: display generic error screen
            }
            console.log(`Error - ${error.message}`);
        });
    },
    showPreview(galleryId) {
        App.previewId = parseInt(galleryId);
        App.screen = SCREEN_PREVIEW;
        App.renderPreviewImage(App.previewId);
        DomUtils.setDisplay('screen-preview', true);
    }
};

const ConfirmDialog = {
    /**
     * @returns {Promise<void>}
     */
    requestAction() {
        return new Promise(function (resolve) {
            // todo: set body-lock class
            // todo: capture scrollY and set as body 'top'

            const node = document.getElementById('confirmation-dialog');
            node.classList = 'app-modal enter';
            DomUtils.setFocus('button-modal-cancel');
            node.addEventListener('click', ConfirmDialog.onClickHandler);
            document.addEventListener('keydown', ConfirmDialog.onKeypressHandler);
            CustomEvent.once('closeConfirmation', resolve);
        });
    },
    onClickHandler(event) {
        let isConfirmed = false;
        let shouldClose = false;
        const eventId = event.target.dataset.eventId;
        switch (eventId) {
            case 'dialog-close':
            case 'dialog-cancel':
                shouldClose = true;
                break;
            case 'dialog-confirm':
                shouldClose = true;
                isConfirmed = true;
                break;
        }

        if (shouldClose) {
            // todo: unset body-lock class
            // todo: capture body 'top' and set as scrollY

            const node = document.getElementById('confirmation-dialog');
            node.removeEventListener('click', ConfirmDialog.onClickHandler);
            document.removeEventListener('keydown', ConfirmDialog.onKeypressHandler);
            window.setTimeout(function () {
                node.classList = 'app-modal';
                CustomEvent.emit('closeConfirmation', isConfirmed);
            }, 241);
            node.classList = 'app-modal exit';
        }
    },
    onKeypressHandler(event) {
        if (event.key === 'Tab') {
            const activeElement = document.activeElement.id;
            if (event.shiftKey && activeElement === 'button-modal-cancel') {
                event.preventDefault();
                DomUtils.setFocus('button-modal-close');
            } else if (!event.shiftKey && activeElement === 'button-modal-close') {
                event.preventDefault();
                DomUtils.setFocus('button-modal-cancel');
            }
        }
    }
};

App.startup();