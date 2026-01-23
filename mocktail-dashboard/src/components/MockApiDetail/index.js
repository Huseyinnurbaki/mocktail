import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, VStack, HStack, Text, DialogRoot, DialogBackdrop, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogActionTrigger, DialogTitle, Portal, Input, Field, NativeSelectRoot, NativeSelectField } from '@chakra-ui/react';
import JsonEditor from '../JsonEditor';
import MockItem from '../MockItem';
import JsonTreeViewer from '../JsonTreeViewer';
import CodeExamplesModal from '../CodeExamplesModal';
import { testApi, put } from '../../utils/request';
import { UPDATE_API } from '../../utils/paths';
import PropTypes from 'prop-types';
import { showToast, TOASTTYPES } from '../../utils/toast';

function MockApiDetail(props) {
  const { catalog, deleteSelectedApi, refetch } = props;
  const { selectedApi } = catalog;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [codeExamplesOpen, setCodeExamplesOpen] = useState(false);
  const [editedResponse, setEditedResponse] = useState('');
  const lastSavedId = useRef(null);

  // Update edited fields when selectedApi ID changes (different endpoint selected)
  useEffect(() => {
    if (selectedApi.ID && selectedApi.ID !== lastSavedId.current) {
      setEditedResponse(JSON.stringify(selectedApi.Response, null, 2));
      lastSavedId.current = null;
    }
  }, [selectedApi.ID]);
  if (!selectedApi.Method) {
    return (
      <VStack align="stretch" gap={4} mt="-1px">
        <Box
          p={6}
          textAlign="center"
          bg="gray.50"
          borderRadius="md"
          border="1px dashed"
          borderColor="gray.300"
          minH="540px"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Text color="gray.500" fontSize="sm">
            Select an endpoint to view details
          </Text>
        </Box>
      </VStack>
    );
  }
  async function testEndpoint() {
    try {
      const response = await testApi(selectedApi);
      const status = response?.status;

      if (!status) {
        showToast(TOASTTYPES.ERROR, 'No response received');
        return;
      }

      // Any response is success - the mock is working as configured
      // Choose toast type based on status code
      let toastType = TOASTTYPES.SUCCESS;
      let message = `✓ Mock returned ${status}`;

      if (status >= 400) {
        toastType = TOASTTYPES.ERROR;
        message = `✓ Mock returned ${status} (error as configured)`;
      } else if (status >= 300) {
        toastType = TOASTTYPES.INFO;
        message = `✓ Mock returned ${status} (redirect)`;
      }

      showToast(toastType, message);
    } catch (error) {
      showToast(TOASTTYPES.ERROR, `Network error: ${error.message || 'Failed to reach endpoint'}`);
    }
  }

  async function handleSave() {
    try {
      const parsedResponse = JSON.parse(editedResponse);

      const body = {
        Endpoint: selectedApi.Endpoint,
        Method: selectedApi.Method,
        StatusCode: selectedApi.StatusCode || 200,
        Delay: selectedApi.Delay || 0,
        Response: parsedResponse
      };

      const url = `${UPDATE_API}/${selectedApi.ID}`;
      const res = await put(url, body);

      if (res?.ID) {
        showToast(TOASTTYPES.SUCCESS, 'Endpoint updated successfully');
        // Mark this ID as just saved to prevent useEffect from resetting
        lastSavedId.current = res.ID;
        catalog.setSelectedApi(res);
        await refetch();
      } else {
        showToast(TOASTTYPES.ERROR, res?.message || 'Failed to update endpoint');
      }
    } catch (error) {
      showToast(TOASTTYPES.ERROR, error.message || 'Invalid JSON format');
    }
  }

  function handleCancel() {
    setEditedResponse(JSON.stringify(selectedApi.Response, null, 2));
  }

  return (
    <VStack align="stretch" gap={4} mt="-1px">
      <MockItem
        disabled
        data={selectedApi}
        showDelayAlways
        onDelete={() => setDeleteDialogOpen(true)}
      />

      <Box minH="462px">
        <VStack align="stretch" gap={4}>
          <JsonEditor
            key={selectedApi.ID}
            value={editedResponse}
            onChange={(newValue) => setEditedResponse(newValue)}
          />
        </VStack>
      </Box>

      <HStack justify="flex-end" gap={4} pt={4}>
        <Button
          variant="ghost"
          colorPalette="gray"
          size="sm"
          onClick={() => setCodeExamplesOpen(true)}
        >
          Code Examples
        </Button>
        <Button
          variant="solid"
          colorPalette="blue"
          size="sm"
          onClick={handleSave}
        >
          Save
        </Button>
      </HStack>

      <CodeExamplesModal
        isOpen={codeExamplesOpen}
        onClose={() => setCodeExamplesOpen(false)}
        api={selectedApi}
      />

      <DialogRoot open={deleteDialogOpen} onOpenChange={(e) => setDeleteDialogOpen(e.open)}>
        <Portal>
          <DialogBackdrop />
          <DialogContent
            position="fixed"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            zIndex="modal"
            maxW="md"
          >
            <DialogHeader>
              <DialogTitle fontSize="lg">Delete Endpoint</DialogTitle>
            </DialogHeader>
            <DialogBody pb={4}>
              <VStack align="stretch" gap={3}>
                <Text color="gray.600" fontSize="sm">
                  Are you sure you want to delete this endpoint? This action cannot be undone.
                </Text>
                <Box
                  p={3}
                  bg="gray.50"
                  borderRadius="md"
                  border="1px solid"
                  borderColor="gray.200"
                >
                  <Text fontFamily="mono" fontSize="sm" fontWeight="medium">
                    {selectedApi.Method} /{selectedApi.Endpoint}
                  </Text>
                </Box>
              </VStack>
            </DialogBody>
            <DialogFooter gap={2}>
              <DialogActionTrigger asChild>
                <Button variant="ghost" size="sm">
                  Cancel
                </Button>
              </DialogActionTrigger>
              <Button
                colorPalette="red"
                size="sm"
                onClick={() => {
                  deleteSelectedApi(selectedApi);
                  setDeleteDialogOpen(false);
                }}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Portal>
      </DialogRoot>
    </VStack>
  );
}

export default MockApiDetail;

MockApiDetail.propTypes = {
  catalog: PropTypes.any,
  apis: PropTypes.array,
  deleteSelectedApi: PropTypes.func,
  refetch: PropTypes.func
};
