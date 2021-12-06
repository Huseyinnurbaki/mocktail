import { useState } from 'react';


function useToastify() {
    const [toastProps, setToastProps] = useState("test");
    function reset() {
        setToastProps(undefined)
    }
    return { toastProps, setToastProps, reset };
}
export default useToastify;
