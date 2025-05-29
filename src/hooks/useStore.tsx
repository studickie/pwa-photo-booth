import { useContext } from 'react';
import { getAll, add, remove } from '../services/store';
import { storeContext } from '../context/storeContext';
import type { StoreModel } from '../types/storeModel';

const useStore = <T extends StoreModel>(storeName: string) => {
    const { store } = useContext(storeContext);
    return {
        getAll: getAll<T>(store, storeName),
        add: add<T>(store, storeName),
        remove: remove<T>(store, storeName)
    };
}

export default useStore;