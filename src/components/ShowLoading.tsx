import type { PropsWithChildren } from "react";

interface Props extends PropsWithChildren {
    isLoading: Boolean;
    message?: string;
}

// todo: add prop to pass component shown when "isLoading" is true

function ShowLoading({ isLoading, message, children }: Props) {
    return (
        <>
            {isLoading 
                ? <p>{ message || 'Loading...' }</p> 
                : children
            }
        </>
    );
}

export default ShowLoading;