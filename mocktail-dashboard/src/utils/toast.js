import { toaster } from '../components/ui/toaster';

// Simple utility function for API response handling
export function showApiResponseToast(response) {
  if (response?.status === 200) {
    toaster.success({
      title: 'Success',
      duration: 5000
    });
    return;
  }
  toaster.error({
    title: response?.message || 'Something went wrong',
    duration: 5000
  });
}

// Simple utility function for custom toasts
export function showToast(type, message, duration = 5000) {
  toaster.create({
    title: message,
    type: type,
    duration: duration
  });
}

export const TOASTTYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  DEFAULT: 'success'
};
