import React, { useState } from 'react';
import { Box, Button, HStack, VStack, IconButton } from '@chakra-ui/react';
import PrefixedInput from '../../../components/PrefixedInput';
import TextInput from '../../../components/TextInput';
import { SAVE_API } from '../../../utils/paths';
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
  const [jsonError, setJsonError] = useState('');
  const [jsonSuccess, setJsonSuccess] = useState('');

  function clearAll() {
    setEndpointValue('');
    setResponseValue('');
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
      <VStack align="stretch" gap={4}>
        <PrefixedInput
          value={endpointValue}
          onChange={(e) => setEndpointValue(e.target.value.replace(/\s/g, ''))}
          selectedMethod={selectedMethod}
          setSelectedMethod={setSelectedMethod}
          HTTP_METHODS={HTTP_METHODS}
          required
        />

        <TextInput
          label="Response Body (JSON)"
          name="responseBody"
          value={responseValue}
          onChange={(e) => {
            setJsonError('');
            setJsonSuccess('');
            setResponseValue(e.target.value);
          }}
          onPaste={handlePaste}
          onBlur={autoBeautifyJson}
          error={jsonError}
          success={jsonSuccess}
          required
          headerActions={
            <HStack gap={1}>
              <Button
                type="button"
                size="xs"
                variant="ghost"
                onClick={beautifyJson}
              >
                Beautify
              </Button>
              <Button
                type="button"
                size="xs"
                variant="ghost"
                onClick={validateJson}
              >
                Validate
              </Button>
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
    </Box>
  );
}

export default GenerateTab;

GenerateTab.propTypes = {
  refetch: PropTypes.func
};
