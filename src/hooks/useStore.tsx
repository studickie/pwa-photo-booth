import { getAll, add, remove } from '../services/store';
import type { StoreModel } from '../types/storeModel';

const useStore = <T extends StoreModel>(store: IDBDatabase, storeName: string) => {
    return {
        getAll: getAll<T>(store, storeName),
        add: add<T>(store, storeName),
        remove: remove<T>(store, storeName)
    };
}

export default useStore;