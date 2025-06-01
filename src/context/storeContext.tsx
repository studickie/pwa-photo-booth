import { createContext, useEffect, useReducer, type PropsWithChildren } from 'react';
import { connect } from '../services/store';

interface StoreContext {
    isLoading: Boolean;
    hasError: Boolean;
    store: IDBDatabase;
}

const initialState: StoreContext = {
    isLoading: true,
    hasError: false,
    store: ({} as IDBDatabase)
};

type ActionType = 'CONNECTION_SUCCESS' | 'CONNECTION_ERROR';
type ReducerAction = Partial<StoreContext> & { type: ActionType };

function reducer(state: StoreContext, action: ReducerAction): StoreContext {
    const { type } = action;
    switch (type) {
        case 'CONNECTION_SUCCESS':
            return { ...state, 
                isLoading: false, 
                hasError: false, 
                store: (action.store as IDBDatabase) 
            };
        case 'CONNECTION_ERROR':
            return { ...state, 
                isLoading: false, 
                hasError: true, 
                store: ({} as IDBDatabase) 
            };
        default:
            console.log(`Unsupported action type "${type}"`);
            return state;
    }
}

export const storeContext = createContext({} as StoreContext);

const useProvideStore = (): StoreContext => {
    const [state, dispatch] = useReducer(reducer, initialState);

    useEffect(() => {
        connect().then((result) => {
            dispatch({ type: 'CONNECTION_SUCCESS', store: result });
        }).catch((error: any) => {
            console.log('IndexedDB Error - ', error);
            dispatch({ type: 'CONNECTION_ERROR' });
        });
    }, []);

    return state;
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
