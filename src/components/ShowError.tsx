import type { PropsWithChildren } from "react";

interface Props extends PropsWithChildren {
    hasError: Boolean;
}

// todo: add prop to pass component shown when "hasError" is true

function ShowError({ hasError, children }: Props) {
    return (
        <>
            {hasError 
                ? <p>Error!</p> 
                : children
            }
        </>
    );
}

export default ShowError;