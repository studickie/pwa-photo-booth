
type CapturePhotoOptions = {
    width: number | undefined;
    height: number | undefined;
};

const useCapturePhoto = () => {
    return (
        videoElement: HTMLVideoElement | null,
        { width, height }: CapturePhotoOptions
    ): Promise<Blob> =>
        new Promise((resolve, reject) => {
            if (videoElement) {
                const canvas = document.createElement('canvas');
                canvas.width = width || videoElement.offsetWidth;
                canvas.height = height || videoElement.offsetHeight;

                // ? HTMLCanvasElement method 'drawImage' accepts HTMLVideoElement only because interface is comparable with expected HTMLImageElement
                const video = videoElement as unknown as HTMLImageElement;

                // todo: 'getContext' possibly returns null; add error handling
                const context = canvas.getContext('2d') as CanvasRenderingContext2D;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                // const dataUrl = canvas.toDataURL('image/jpeg');
                canvas.toBlob((blob) => resolve(blob as Blob), 'image/jpeg');
            } else {
                reject('Video element is null');
            }
        });
}

export default useCapturePhoto;