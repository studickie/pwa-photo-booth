import { getAll, add, remove } from '../services/store';
import { useStoreContext } from '../context/storeContext';
import type { StoreModel } from '../types/storeModel';

const useStore = <T extends StoreModel>(storeName: string) => {
    const { store } = useStoreContext();
    return {
        // todo: improve support for unset variables
        getAll: getAll<T>(store as IDBDatabase, storeName),
        add: add<T>(store as IDBDatabase, storeName),
        remove: remove<T>(store as IDBDatabase, storeName)
    };
}

export default useStore;