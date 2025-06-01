import { createContext, useEffect, useReducer, type PropsWithChildren } from 'react';
// import type { GetReturnType } from '../types/helpers';
// withMediaStream: <F extends (m: MediaStream) => any>(fn: F) => GetReturnType<F>

interface MediaStreamContext {
    isLoading: Boolean;
    hasError: Boolean;
    mediaStream: MediaStream;
}

const initialState: MediaStreamContext = {
    isLoading: true,
    hasError: false,
    mediaStream: ({} as MediaStream)
};

type ActionType = 'CONNECTION_SUCCESS' | 'CONNECTION_ERROR';
type ReducerAction = Partial<MediaStreamContext> & { type: ActionType };

function reducer(state: MediaStreamContext, action: ReducerAction): MediaStreamContext {
    const { type } = action;
    switch(type) {
        case 'CONNECTION_SUCCESS':
            return {  ...state,
                isLoading: false, 
                hasError: false, 
                mediaStream: (action.mediaStream as MediaStream)
            };
        case 'CONNECTION_ERROR':
            return {  ...state,
                isLoading: false, 
                hasError: true, 
                mediaStream: ({} as MediaStream)
            };
        default:
            console.log(`Unsupported action type "${type}"`);
            return state;
    }
}

export const mediaStreamContext = createContext(({} as MediaStreamContext));

const useProvideMediaStream = (): MediaStreamContext => {

    const [state, dispatch] = useReducer(reducer, initialState);

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        }).then(result => {
            dispatch({ type: 'CONNECTION_SUCCESS', mediaStream: result });
        }).catch(error => {
            console.log('MediaStream Error - ', error);
            dispatch({ type: 'CONNECTION_ERROR' });
        });
    }, []);

    return state;
}

interface Props extends PropsWithChildren { }

const MediaStreamProvider = ({ children }: Props) => {
    const data: MediaStreamContext = useProvideMediaStream();
    return (
        <mediaStreamContext.Provider value={data}>
            { children }
        </mediaStreamContext.Provider>
    );
}

export default MediaStreamProvider;