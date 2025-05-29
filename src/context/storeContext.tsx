import { createContext, useEffect, useState, type PropsWithChildren } from 'react';
import { connect } from '../services/store';

interface StoreContext {
    isReady: Boolean;
    store: IDBDatabase;
}

export const storeContext = createContext({} as StoreContext);

const useProvideStore = (): StoreContext => {
    const [store, setStore] = useState({} as IDBDatabase);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        connect().then((result) => {
            setStore(result);
            setIsReady(true);
        });
    }, []);

    return {
        isReady,
        store
    };
}

interface Props extends PropsWithChildren { }

const StoreProvider = ({ children }: Props) => {
    const store: StoreContext = useProvideStore();
    return (
        <storeContext.Provider value={store}>
            {children}
        </storeContext.Provider>
    );
}

export default StoreProvider;
