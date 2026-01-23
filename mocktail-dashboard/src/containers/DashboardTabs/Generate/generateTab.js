import React, { useState } from 'react';
import { Box, Button, HStack, VStack, IconButton, Input, Field, NativeSelectRoot, NativeSelectField, Group, Text, DialogRoot, DialogTrigger, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogActionTrigger, DialogTitle, DialogBackdrop, Textarea, Portal, Menu } from '@chakra-ui/react';
import { Tooltip } from '../../../components/ui/tooltip';
import JsonEditor from '../../../components/JsonEditor';
import { SAVE_API, PUBLIC_MOCKTAIL_URL } from '../../../utils/paths';
import { post } from '../../../utils/request';
import PropTypes from 'prop-types';
import { showToast, TOASTTYPES } from '../../../utils/toast';

const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE'
};

function GenerateTab(props) {
  const { refetch } = props;
  const [endpointValue, setEndpointValue] = useState('');
  const [responseValue, setResponseValue] = useState('');
  const [selectedMethod, setSelectedMethod] = useState(HTTP_METHODS.GET);
  const [statusCode, setStatusCode] = useState(200);
  const [delay, setDelay] = useState(0);
  const [jsonError, setJsonError] = useState('');
  const [jsonSuccess, setJsonSuccess] = useState('');
  const [promptDialogOpen, setPromptDialogOpen] = useState(false);
  const [arrayDialogOpen, setArrayDialogOpen] = useState(false);
  const [randomizeDialogOpen, setRandomizeDialogOpen] = useState(false);
  const [anonymizeDialogOpen, setAnonymizeDialogOpen] = useState(false);

  function clearAll() {
    setEndpointValue('');
    setResponseValue('');
    setStatusCode(200);
    setDelay(0);
    setJsonError('');
    setJsonSuccess('');
  }

  function beautifyJson() {
    if (!responseValue.trim()) return;
    try {
      const parsed = JSON.parse(responseValue);
      setResponseValue(JSON.stringify(parsed, null, 2));
      setJsonError('');
      setJsonSuccess('');
    } catch (error) {
      setJsonError(error.message);
      setJsonSuccess('');
    }
  }

  function autoBeautifyJson() {
    if (!responseValue.trim()) return;
    try {
      const parsed = JSON.parse(responseValue);
      setResponseValue(JSON.stringify(parsed, null, 2));
    } catch (error) {
      // Silently fail - user is still typing
    }
  }

  function handlePaste(e) {
    const pastedText = e.clipboardData.getData('text');
    try {
      const parsed = JSON.parse(pastedText);
      e.preventDefault();
      setResponseValue(JSON.stringify(parsed, null, 2));
    } catch (error) {
      // Let default paste behavior happen for invalid JSON
    }
  }

  function validateJson() {
    if (!responseValue.trim()) return;
    try {
      JSON.parse(responseValue);
      setJsonError('');
      setJsonSuccess('Valid');
      setTimeout(() => setJsonSuccess(''), 2000);
    } catch (error) {
      setJsonError(error.message);
      setJsonSuccess('');
    }
  }

  async function handleSave(e) {
    e.preventDefault();

    if (!endpointValue.trim()) {
      showToast(TOASTTYPES.ERROR, 'Endpoint is required');
      return;
    }

    if (!responseValue.trim()) {
      showToast(TOASTTYPES.ERROR, 'Response body is required');
      return;
    }

    try {
      const parsedResponse = JSON.parse(responseValue);
      if (typeof parsedResponse !== 'object') {
        throw new Error('Response must be a valid JSON object');
      }

      const body = {
        Endpoint: endpointValue,
        Method: selectedMethod,
        StatusCode: statusCode,
        Delay: delay,
        Response: parsedResponse
      };

      const res = await post(SAVE_API, body);
      if (res?.status === 200) {
        showToast(TOASTTYPES.SUCCESS, 'Endpoint created successfully');
      } else {
        showToast(TOASTTYPES.ERROR, res?.message || 'Failed to create endpoint');
      }
      clearAll();
      await refetch();
    } catch (error) {
      showToast(TOASTTYPES.ERROR, error.message || 'Invalid JSON format');
    }
  }

  return (
    <Box as="form" onSubmit={handleSave}>
      <HStack align="flex-start" gap={6} minH="570px" maxH="570px">
        {/* Left Column */}
        <VStack align="stretch" gap={4} flex="1" minW="0">
          <Field.Root>
            <Field.Label fontSize="sm" fontWeight="medium" mb={2}>
              HTTP Method
            </Field.Label>
            <NativeSelectRoot>
              <NativeSelectField
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
                size="sm"
              >
                {Object.keys(HTTP_METHODS).map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </NativeSelectField>
            </NativeSelectRoot>
          </Field.Root>

          <Field.Root>
            <Field.Label fontSize="sm" fontWeight="medium" mb={2}>
              Endpoint Path
            </Field.Label>
            <Group attached width="100%">
              <Box
                px={3}
                display="flex"
                alignItems="center"
                bg="gray.50"
                fontSize="sm"
                color="gray.600"
                whiteSpace="nowrap"
                border="1px solid"
                borderColor="gray.300"
                height="40px"
                minWidth="220px"
              >
                {PUBLIC_MOCKTAIL_URL}/
              </Box>
              <Input
                onChange={(e) => setEndpointValue(e.target.value.replace(/\s/g, ''))}
                value={endpointValue}
                autoComplete="off"
                required
                placeholder="your-endpoint"
                fontSize="sm"
                flex="1"
              />
            </Group>
          </Field.Root>

          <Field.Root>
            <Field.Label fontSize="sm" fontWeight="medium" mb={2}>
              Response Status Code
            </Field.Label>
            <NativeSelectRoot>
              <NativeSelectField
                value={statusCode}
                onChange={(e) => setStatusCode(Number(e.target.value))}
                size="sm"
              >
                <optgroup label="Success">
                  <option value="200">200 OK</option>
                  <option value="201">201 Created</option>
                  <option value="204">204 No Content</option>
                </optgroup>
                <optgroup label="Client Error">
                  <option value="400">400 Bad Request</option>
                  <option value="401">401 Unauthorized</option>
                  <option value="403">403 Forbidden</option>
                  <option value="404">404 Not Found</option>
                  <option value="422">422 Unprocessable Entity</option>
                  <option value="429">429 Too Many Requests</option>
                </optgroup>
                <optgroup label="Server Error">
                  <option value="500">500 Internal Server Error</option>
                  <option value="502">502 Bad Gateway</option>
                  <option value="503">503 Service Unavailable</option>
                  <option value="504">504 Gateway Timeout</option>
                </optgroup>
              </NativeSelectField>
            </NativeSelectRoot>
          </Field.Root>

          <Field.Root>
            <Field.Label fontSize="sm" fontWeight="medium" mb={2}>
              Delay (ms)
            </Field.Label>
            <Input
              type="number"
              value={delay}
              onChange={(e) => setDelay(Number(e.target.value))}
              min="0"
              max="30000"
              placeholder="0"
              size="sm"
            />
          </Field.Root>
        </VStack>

        {/* Right Column */}
        <VStack align="stretch" flex="1" gap={4} minW="0" overflow="hidden">
          <JsonEditor
            label="Response Body (JSON)"
            value={responseValue}
            onChange={(newValue) => {
              setJsonError('');
              setJsonSuccess('');
              setResponseValue(newValue);
            }}
            error={jsonError}
            placeholderText='Paste or type your JSON response here...'
            headerActions={
              <HStack gap={3}>
                <HStack gap={2}>
                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    onClick={() => {
                      setResponseValue('');
                      setJsonError('');
                    }}
                  >
                    Clear
                  </Button>
                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    borderRadius="6px"
                    _hover={{ borderRadius: "6px" }}
                    onClick={beautifyJson}
                  >
                    Beautify
                  </Button>
                  {/* <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    onClick={validateJson}
                  >
                    Validate
                  </Button> */}
                </HStack>
                <Menu.Root positioning={{ placement: "right-start" }}>
                  <Menu.Trigger asChild>
                    <Button
                      type="button"
                      size="xs"
                      variant="ghost"
                      borderRadius="6px"
                      _hover={{ borderRadius: "6px" }}
                      _focus={{ boxShadow: "none", outline: "none" }}
                      _active={{ borderColor: "transparent" }}
                    >
                      Generate ▾
                    </Button>
                  </Menu.Trigger>
                  <Portal>
                    <Menu.Positioner>
                      <Menu.Content>
                        <Menu.Item value="prompt" onClick={() => setPromptDialogOpen(true)}>Generate from prompt</Menu.Item>
                        <Menu.Item value="array" onClick={() => setArrayDialogOpen(true)}>Generate array items</Menu.Item>
                        <Menu.Item value="randomize" onClick={() => setRandomizeDialogOpen(true)}>Randomize values</Menu.Item>
                        <Menu.Separator />
                        <Menu.Item value="anonymize" onClick={() => setAnonymizeDialogOpen(true)}>Anonymize</Menu.Item>
                      </Menu.Content>
                    </Menu.Positioner>
                  </Portal>
                </Menu.Root>
              </HStack>
            }
          />

          <HStack justifyContent="flex-end">
            <Button
              type="submit"
              colorPalette="blue"
              disabled={!endpointValue || !responseValue}
            >
              Save
            </Button>
          </HStack>
        </VStack>
      </HStack>

      {/* Generate from prompt modal */}
      <DialogRoot open={promptDialogOpen} onOpenChange={(e) => setPromptDialogOpen(e.open)} size="xl">
        <Portal>
          <DialogBackdrop />
          <DialogContent
            position="fixed"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
          >
            <DialogHeader>
              <DialogTitle>Generate from prompt</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <VStack align="stretch" gap={4}>
                <Box bg="blue.50" border="1px solid" borderColor="blue.200" borderRadius="md" p={3}>
                  <Text fontSize="sm" color="blue.700" fontWeight="medium">
                    🚧 This feature is under development
                  </Text>
                </Box>
                <Text fontSize="sm" color="gray.600">
                  Generate a JSON response from a natural language prompt. Existing content can be replaced or merged.
                </Text>
                <Field.Root>
                  <Field.Label fontSize="sm">Prompt</Field.Label>
                  <Textarea
                    placeholder="Describe the JSON structure you want to generate..."
                    rows={4}
                    fontSize="sm"
                  />
                </Field.Root>
              </VStack>
            </DialogBody>
            <DialogFooter>
              <DialogActionTrigger asChild>
                <Button variant="outline" size="sm">Cancel</Button>
              </DialogActionTrigger>
              <Button colorPalette="blue" size="sm" disabled>Generate</Button>
            </DialogFooter>
          </DialogContent>
        </Portal>
      </DialogRoot>

      {/* Generate array items modal */}
      <DialogRoot open={arrayDialogOpen} onOpenChange={(e) => setArrayDialogOpen(e.open)} size="xl">
        <Portal>
          <DialogBackdrop />
          <DialogContent
            position="fixed"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
          >
            <DialogHeader>
              <DialogTitle>Generate array items</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <VStack align="stretch" gap={4}>
                <Box bg="blue.50" border="1px solid" borderColor="blue.200" borderRadius="md" p={3}>
                  <Text fontSize="sm" color="blue.700" fontWeight="medium">
                    🚧 This feature is under development
                  </Text>
                </Box>
                <Text fontSize="sm" color="gray.600">
                  Adjust array sizes by generating items from an existing array element.
                </Text>
              </VStack>
            </DialogBody>
            <DialogFooter>
              <DialogActionTrigger asChild>
                <Button variant="outline" size="sm">Cancel</Button>
              </DialogActionTrigger>
              <Button colorPalette="blue" size="sm" disabled>Generate</Button>
            </DialogFooter>
          </DialogContent>
        </Portal>
      </DialogRoot>

      {/* Randomize values modal */}
      <DialogRoot open={randomizeDialogOpen} onOpenChange={(e) => setRandomizeDialogOpen(e.open)} size="xl">
        <Portal>
          <DialogBackdrop />
          <DialogContent
            position="fixed"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
          >
            <DialogHeader>
              <DialogTitle>Randomize values</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <VStack align="stretch" gap={4}>
                <Box bg="blue.50" border="1px solid" borderColor="blue.200" borderRadius="md" p={3}>
                  <Text fontSize="sm" color="blue.700" fontWeight="medium">
                    🚧 This feature is under development
                  </Text>
                </Box>
                <Text fontSize="sm" color="gray.600">
                  Replace existing values with realistic random data while keeping the same JSON structure.
                </Text>
                <Text fontSize="xs" color="gray.500">
                  This will preserve all keys and data types while generating new random values.
                </Text>
              </VStack>
            </DialogBody>
            <DialogFooter>
              <DialogActionTrigger asChild>
                <Button variant="outline" size="sm">Cancel</Button>
              </DialogActionTrigger>
              <Button colorPalette="blue" size="sm" disabled>Randomize</Button>
            </DialogFooter>
          </DialogContent>
        </Portal>
      </DialogRoot>

      {/* Anonymize modal */}
      <DialogRoot open={anonymizeDialogOpen} onOpenChange={(e) => setAnonymizeDialogOpen(e.open)} size="xl">
        <Portal>
          <DialogBackdrop />
          <DialogContent
            position="fixed"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
          >
            <DialogHeader>
              <DialogTitle>Anonymize</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <VStack align="stretch" gap={4}>
                <Box bg="blue.50" border="1px solid" borderColor="blue.200" borderRadius="md" p={3}>
                  <Text fontSize="sm" color="blue.700" fontWeight="medium">
                    🚧 This feature is under development
                  </Text>
                </Box>
                <Text fontSize="sm" color="gray.600">
                  Replace selected sensitive fields with safe, non-identifiable values. Structure and relationships are preserved.
                </Text>
                <Text fontSize="xs" color="gray.500">
                  Common sensitive fields like email, name, phone, and address will be automatically detected and replaced.
                </Text>
              </VStack>
            </DialogBody>
            <DialogFooter>
              <DialogActionTrigger asChild>
                <Button variant="outline" size="sm">Cancel</Button>
              </DialogActionTrigger>
              <Button colorPalette="blue" size="sm" disabled>Anonymize</Button>
            </DialogFooter>
          </DialogContent>
        </Portal>
      </DialogRoot>
    </Box>
  );
}

export default GenerateTab;

GenerateTab.propTypes = {
  refetch: PropTypes.func
};
