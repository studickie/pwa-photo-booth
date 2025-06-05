import { createContext, useContext, useEffect, useReducer, type PropsWithChildren } from 'react';

interface MediaStreamContext {
    isLoading: Boolean;
    hasError: Boolean;
    mediaStream: MediaStream | null;
}

type ContextState = MediaStreamContext;

const initialState: ContextState = {
    isLoading: true,
    hasError: false,
    mediaStream: null
};

type ContextAction = { 
    type: 'connectSuccess',
    mediaStream: MediaStream
} | {
    type: 'connectError'
};

function reducer(state: ContextState, action: ContextAction) {
    const { type } = action;
    switch(type) {
        case 'connectSuccess':
            return {  ...state,
                isLoading: false, 
                hasError: false, 
                mediaStream: action.mediaStream
            };
        case 'connectError':
            return {  ...state,
                isLoading: false, 
                hasError: true, 
                mediaStream: null
            };
        default:
            console.log(`Unsupported action type "${type}"`);
            return state;
    }
}

const mediaStreamContext = createContext(({} as MediaStreamContext));

interface Props extends PropsWithChildren {};

export const MediaStreamProvider = ({ children }: Props) => {

    const [state, dispatch] = useReducer(reducer, initialState);

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        }).then(result => {
            dispatch({ type: 'connectSuccess', mediaStream: result });
        }).catch(error => {
            console.log('MediaStream Error - ', error);
            dispatch({ type: 'connectError' });
        });
    }, []);

    return (
        <mediaStreamContext.Provider value={state}>
            { children }
        </mediaStreamContext.Provider>
    );
}

export const useMediaStreamContext = () => useContext(mediaStreamContext);