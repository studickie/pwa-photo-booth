import { createContext, useContext, useEffect, useReducer, type PropsWithChildren } from 'react';
import { connect } from '../services/store';

interface StoreState {
    isLoading: Boolean;
    hasError: Boolean;
    store: IDBDatabase | null;
};

type StoreStateAction = {
    type: 'connectSuccess',
    store: IDBDatabase
} | {
    type: 'connectError'
};

function reducer(state: StoreState, action: StoreStateAction) {
    const { type } = action;
    switch (type) {
        case 'connectSuccess':
            return {
                ...state,
                isLoading: false,
                hasError: false,
                store: action.store
            };
        case 'connectError':
            return {
                ...state,
                isLoading: false,
                hasError: true,
                store: null
            };
        default:
            console.log(`Unsupported action type "${type}"`);
            return state;
    };
}

/*
    Store Context:

    Start a connection to Browser's IndexedDB, Provide 
    subscribers with access resulting IndexedDB instance
*/
interface StoreContext extends StoreState { };

const storeContext = createContext({} as StoreContext);

interface Props extends PropsWithChildren { }

export function StoreProvider({ children }: Props) {

    const [state, dispatch] = useReducer(reducer, {
        isLoading: true,
        hasError: false,
        store: null
    });

    useEffect(() => {
        connect().then((store) => {
            dispatch({ type: 'connectSuccess', store });
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
