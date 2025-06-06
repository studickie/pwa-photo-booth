import { createContext, useContext, useRef, type PropsWithChildren, type RefObject } from 'react';

/*
    Video Player Context: 

    Provide subscribers access to a stored HTMLVideoElement
 */

type VideoPlayerContext = RefObject<HTMLVideoElement | null>;

const videoPlayerContext = createContext<VideoPlayerContext>({ current: null } as RefObject<null>);

interface Props extends PropsWithChildren {};

export function VideoPlayerProvider({ children }: Props) {
    const videoElementRef = useRef<HTMLVideoElement | null>(null);
    return (
        <videoPlayerContext.Provider value={videoElementRef}>
            { children }
        </videoPlayerContext.Provider>
    );
}

export const useVideoPlayerContext = () => useContext(videoPlayerContext);