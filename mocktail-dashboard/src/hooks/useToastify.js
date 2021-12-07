import { useState } from 'react';


function useToastify() {
    const [toastProps, setToastProps] = useState(defaultToastProps);
    function reset() {
        setToastProps(undefined)
    }
    return { toastProps, setToastProps, reset };
}
export default useToastify;

export const TOASTTYPES = {
    INFO: "info",
    SUCCESS: "success",
    ERROR: "error",
    WARNING: "warn",
    DEFAULT: 'success',
}

const defaultToastProps = {
    toastType: TOASTTYPES.DEFAULT,
    message: "Mocktail Rocks 💣💣",
}