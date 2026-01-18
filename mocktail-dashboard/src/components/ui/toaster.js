import { Toast, Toaster as ChakraToaster, createToaster } from '@chakra-ui/react';

export const toaster = createToaster({
  placement: 'top-end',
  pauseOnPageIdle: true,
  offsets: '16px',
});

export function Toaster() {
  return (
    <ChakraToaster toaster={toaster}>
      {(toast) => (
        <Toast.Root maxW="400px" minW="300px" gap={2}>
          {toast.title && <Toast.Title pr={6}>{toast.title}</Toast.Title>}
          {toast.description && <Toast.Description>{toast.description}</Toast.Description>}
          <Toast.CloseTrigger position="absolute" top={2} right={2} />
        </Toast.Root>
      )}
    </ChakraToaster>
  );
}
