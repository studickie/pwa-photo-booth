import { createContext, useContext, useRef, type PropsWithChildren, type RefObject } from 'react';

type VideoPlayerContext = RefObject<HTMLVideoElement | null>;

/**
 * @description Provide subscribers a referrence to a HTMLVideoElement
 */
const videoPlayerContext = createContext<VideoPlayerContext>({ current: null } as RefObject<null>);

interface Props extends PropsWithChildren {};

export const VideoPlayerProvider = ({ children }: Props) => {
    const videoElementRef = useRef<HTMLVideoElement | null>(null);
    return (
        <videoPlayerContext.Provider value={videoElementRef}>
            { children }
        </videoPlayerContext.Provider>
    );
}

export const useVideoPlayerContext = () => useContext(videoPlayerContext);