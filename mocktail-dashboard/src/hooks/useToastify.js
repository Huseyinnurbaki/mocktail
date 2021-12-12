import { useState } from 'react';

function useToastify() {
  const [toastProps, setToastProps] = useState(defaultToastProps);
  function reset() {
    setToastProps(undefined);
  }

  function setToastPropsHandler(response) {
    if (response.status === 200) {
      setToastProps(defaultSuccessToast);
      return;
    }
    setToastProps(defaultErrorToast);
  }
  return { toastProps, setToastProps, reset, setToastPropsHandler };
}
export default useToastify;

export const TOASTTYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warn',
  DEFAULT: 'success'
};

const defaultToastProps = {
  toastType: TOASTTYPES.DEFAULT,
  message: 'Mocktail Rocks 💣💣'
};

export const defaultSuccessToast = {
  toastType: TOASTTYPES.SUCCESS,
  message: 'Success 🎉🎉'
};
export const defaultErrorToast = {
  toastType: TOASTTYPES.ERROR,
  message: 'Something went wrong ☹️☹️	'
};
