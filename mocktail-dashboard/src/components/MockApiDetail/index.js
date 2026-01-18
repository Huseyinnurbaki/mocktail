import React, { useState } from 'react';
import { Box, Button, VStack, HStack, Text, DialogRoot, DialogBackdrop, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogActionTrigger, Portal } from '@chakra-ui/react';
import TextInput from '../TextInput';
import MockItem from '../MockItem';
import { testApi } from '../../utils/request';
import PropTypes from 'prop-types';
import { showToast, TOASTTYPES } from '../../utils/toast';

function MockApiDetail(props) {
  const { catalog, deleteSelectedApi } = props;
  const { selectedApi } = catalog;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  if (!selectedApi.Method) {
    return (
      <VStack align="stretch" gap={4} mt="-1px">
        <HStack justify="space-between" align="center">
          <Text fontSize="lg" fontWeight="semibold">
            Endpoint Details
          </Text>
          <Button variant="outline" size="sm" visibility="hidden">
            Export
          </Button>
        </HStack>
        <Box
          p={6}
          textAlign="center"
          bg="gray.50"
          borderRadius="md"
          border="1px dashed"
          borderColor="gray.300"
          minH="300px"
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
      if (response && response.status >= 200 && response.status < 300) {
        showToast(TOASTTYPES.SUCCESS, `Endpoint tested successfully! Status: ${response.status}`);
      } else {
        showToast(TOASTTYPES.ERROR, `Test failed with status: ${response?.status || 'unknown'}`);
      }
    } catch (error) {
      showToast(TOASTTYPES.ERROR, `Test failed: ${error.message || 'Network error'}`);
    }
  }

  return (
    <VStack align="stretch" gap={4} mt="-1px">
      <HStack justify="space-between" align="center">
        <Text fontSize="lg" fontWeight="semibold">
          Endpoint Details
        </Text>
        <Button variant="outline" size="sm" visibility="hidden">
          Export
        </Button>
      </HStack>

      <Box minH="462px">
        <VStack align="stretch" gap={4}>
          <Box>
            <MockItem disabled data={selectedApi} />
          </Box>

          <TextInput
            key={selectedApi.ID}
            label="Response"
            disabled
            rows={17}
            value={JSON.stringify(selectedApi.Response, null, 2)}
          />
        </VStack>
      </Box>

      <HStack justify="flex-end" gap={2} pt={4} borderTop="1px solid" borderColor="gray.200">
        <Button
          variant="ghost"
          colorPalette="red"
          size="sm"
          onClick={() => setDeleteDialogOpen(true)}
        >
          Delete
        </Button>
        <Button
          variant="ghost"
          colorPalette="blue"
          size="sm"
          onClick={() => testEndpoint()}
        >
          Test Endpoint
        </Button>
      </HStack>

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
            <DialogHeader>Delete Endpoint</DialogHeader>
            <DialogBody>
              <Text>
                Are you sure you want to delete this endpoint?
              </Text>
              <Text mt={2} fontWeight="semibold">
                {selectedApi.Method} /{selectedApi.Endpoint}
              </Text>
            </DialogBody>
            <DialogFooter>
              <DialogActionTrigger asChild>
                <Button variant="outline" size="sm">
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
  deleteSelectedApi: PropTypes.func
};
