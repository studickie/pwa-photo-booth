import { type StoreModel } from '../types/storeModel';
import { type GetReturnType } from '../types/helpers';
const { VITE_DB_NAME, VITE_DB_VERSION } = import.meta.env;

// ? Quirk: explicitly set property 'result' on 'target', otherwise it is not found
type VersionChangeTarget = EventTarget & { result: IDBDatabase };
type OnUpgradeHandler = (event: IDBVersionChangeEvent) => void;

const onUpgrade: OnUpgradeHandler = (event) => {
    const db = (event.target as VersionChangeTarget).result;
    console.log(`Upgrading to version ${db.version}`);
    db.createObjectStore('gallery', { keyPath: 'id' });
}

const getDatabase = (dbName: string, dbVersion: number, onUpgrade: OnUpgradeHandler): Promise<IDBDatabase> =>
    new Promise((resolve, reject) => {
        const request = window.indexedDB.open(dbName, dbVersion);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => onUpgrade(event);
    });

const getAllEntries = <T extends StoreModel>(store: IDBObjectStore): Promise<T[]> =>
    new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });

const addEntry = <T extends StoreModel>(store: IDBObjectStore, data: Omit<T, 'id'>): Promise<T['id']> =>
    new Promise((resolve, reject) => {
        // todo: refactor this out of here
        if (store.autoIncrement !== true) {
            const id = Date.now().toString(36) + Math.random().toString(36).substring(2,8);
            data = { ...data, id };
        }

        const request = store.add(data);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result as T['id']);
    });

const removeEntry = <T extends StoreModel>(store: IDBObjectStore, key: T['id']): Promise<Boolean> =>
    new Promise((resolve, reject) => {
        const request = store.delete(key);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(true);
    });

const withStore = (db: IDBDatabase) =>
    (storeName: string) =>
        (mode: IDBTransactionMode = 'readonly') =>
            <F extends (...args: any[]) => any>(fn: F) =>
                // todo: fix params to show correctly
                (arg?: Parameters<F>[1]): GetReturnType<F> => {
                    const tx = db.transaction(storeName, mode);
                    const store = tx.objectStore(storeName);
                    return fn(store, arg);
                }

export const connect = () => getDatabase(VITE_DB_NAME, VITE_DB_VERSION, onUpgrade);

export const getAll = <T extends StoreModel>(db: IDBDatabase, storeName: string) =>
    withStore(db)(storeName)('readonly')(getAllEntries<T>);

export const add = <T extends StoreModel>(db: IDBDatabase, storeName: string) =>
    withStore(db)(storeName)('readwrite')(addEntry<T>);

export const remove = <T extends StoreModel>(db: IDBDatabase, storeName: string) =>
    withStore(db)(storeName)('readwrite')(removeEntry<T>);