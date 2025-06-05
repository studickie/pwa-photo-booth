import { createContext, useContext, useEffect, useReducer, type PropsWithChildren } from 'react';
import { connect } from '../services/store';

interface StoreContext {
    isLoading: Boolean;
    hasError: Boolean;
    store: IDBDatabase | null;
};

type ContextState = StoreContext;

const initialState: ContextState = {
    isLoading: true,
    hasError: false,
    store: null
};

type ContextAction = {
    type: 'connectSuccess',
    store: IDBDatabase
} | {
    type: 'connectError'
};

function reducer(state: ContextState, action: ContextAction) {
    const { type } = action;
    switch (type) {
        case 'connectSuccess':
            return { ...state, 
                isLoading: false, 
                hasError: false, 
                store: action.store 
            };
        case 'connectError':
            return { ...state, 
                isLoading: false, 
                hasError: true, 
                store: null
            };
        default:
            console.log(`Unsupported action type "${type}"`);
            return state;
    };
}

/**
 * @description Provide subscribers access to an IndexedDB instance
 */
const storeContext = createContext({} as StoreContext);

interface Props extends PropsWithChildren { }

export const StoreProvider = ({ children }: Props) => {
    
    const [state, dispatch] = useReducer(reducer, initialState);

    useEffect(() => {
        connect().then((result) => {
            dispatch({ type: 'connectSuccess', store: result });
        }).catch((error: any) => {
            console.log('IndexedDB Error - ', error);
            dispatch({ type: 'connectError' });
        });
    }, []);

    return (
        <storeContext.Provider value={state}>
            {children}
        </storeContext.Provider>
    );
}

export const useStoreContext = () => useContext(storeContext);
