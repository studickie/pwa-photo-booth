
export const getMediaStream = (): Promise<MediaStream> =>
    navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
    });

export const stopMediaTracks = (stream: MediaStream): void => {
    const tracks = stream.getTracks();
    tracks.forEach(track => { track.stop() });
}

export const getActiveTrackSettings = (stream: MediaStream): MediaTrackSettings => {
    const tracks = stream.getVideoTracks();
    const activeTracks = tracks.filter(trk => trk.readyState === 'live');
    
    // ? what if activeTracks.length > 1
    
    return activeTracks[0].getSettings();
}