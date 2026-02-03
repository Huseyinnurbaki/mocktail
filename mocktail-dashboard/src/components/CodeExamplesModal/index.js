import React, { useState } from 'react';
import { Box, Button, DialogRoot, DialogBackdrop, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogActionTrigger, DialogTitle, Portal, Tabs, Code, ClipboardRoot, ClipboardTrigger, IconButton, Input, HStack, Text, Field } from '@chakra-ui/react';
import PropTypes from 'prop-types';
import { PUBLIC_MOCKTAIL_URL } from '../../utils/paths';
import { LuCopy, LuEye, LuEyeOff } from 'react-icons/lu';

function CodeExamplesModal({ isOpen, onClose, api }) {
  const [activeTab, setActiveTab] = useState('curl');
  const [showApiKey, setShowApiKey] = useState(false);

  const apiKey = process.env.REACT_APP_MOCKTAIL_API_KEY || '';

  const fullUrl = `${PUBLIC_MOCKTAIL_URL}/${api.Endpoint}`;

  // Display value for code examples (masked or actual)
  const displayKey = showApiKey ? apiKey : '*******';

  // For copying - always use actual key
  const copyKey = apiKey;

  const examples = {
    curl: `curl -X ${api.Method} '${fullUrl}' \\
  -H 'Content-Type: application/json'${apiKey ? ` \\\n  -H 'X-API-Key: ${displayKey}'` : ''}`,

    nodejs: `const axios = require('axios');

const response = await axios.${api.Method.toLowerCase()}('${fullUrl}', {
  headers: {
    'Content-Type': 'application/json'${apiKey ? `,\n    'X-API-Key': '${displayKey}'` : ''}
  }
});

console.log(response.data);`,

    python: `import requests

response = requests.${api.Method.toLowerCase()}('${fullUrl}',
    headers={
        'Content-Type': 'application/json'${apiKey ? `,\n        'X-API-Key': '${displayKey}'` : ''}
    }
)

print(response.json())`,

    go: `package main

import (
    "fmt"
    "net/http"
    "io"
)

func main() {
    req, _ := http.NewRequest("${api.Method}", "${fullUrl}", nil)
    req.Header.Set("Content-Type", "application/json")${apiKey ? `\n    req.Header.Set("X-API-Key", "${displayKey}")` : ''}

    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`
  };

  // For clipboard - always use actual API key
  const copyExamples = {
    curl: `curl -X ${api.Method} '${fullUrl}' \\
  -H 'Content-Type: application/json'${apiKey ? ` \\\n  -H 'X-API-Key: ${copyKey}'` : ''}`,

    nodejs: `const axios = require('axios');

const response = await axios.${api.Method.toLowerCase()}('${fullUrl}', {
  headers: {
    'Content-Type': 'application/json'${apiKey ? `,\n    'X-API-Key': '${copyKey}'` : ''}
  }
});

console.log(response.data);`,

    python: `import requests

response = requests.${api.Method.toLowerCase()}('${fullUrl}',
    headers={
        'Content-Type': 'application/json'${apiKey ? `,\n        'X-API-Key': '${copyKey}'` : ''}
    }
)

print(response.json())`,

    go: `package main

import (
    "fmt"
    "net/http"
    "io"
)

func main() {
    req, _ := http.NewRequest("${api.Method}", "${fullUrl}", nil)
    req.Header.Set("Content-Type", "application/json")${apiKey ? `\n    req.Header.Set("X-API-Key", "${copyKey}")` : ''}

    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    fmt.Println(string(body))
}`
  };

  return (
    <DialogRoot open={isOpen} onOpenChange={(e) => onClose()} size="xl">
      <Portal>
        <DialogBackdrop />
        <DialogContent
          position="fixed"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          maxW="700px"
          minH="400px"
        >
          <DialogHeader>
            <DialogTitle>Code Examples</DialogTitle>
          </DialogHeader>
          <DialogBody>
            {/* API Key Input */}
            <Box mb={4}>
              <Field.Root>
                <HStack gap={2}>
                  <Box flex="1">
                    <Field.Label fontSize="sm" mb={1}>API Key (Optional)</Field.Label>
                    <HStack>
                      <Input
                        type="text"
                        value={showApiKey ? apiKey : (apiKey ? '*******' : '')}
                        readOnly
                        placeholder="Not set (REACT_APP_MOCKTAIL_API_KEY)"
                        size="sm"
                        fontFamily="monospace"
                        autoComplete="off"
                        name="api-key"
                        bg="gray.50"
                        cursor="default"
                      />
                      <IconButton
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowApiKey(!showApiKey)}
                        aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
                      >
                        {showApiKey ? <LuEyeOff /> : <LuEye />}
                      </IconButton>
                    </HStack>
                  </Box>
                </HStack>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  {apiKey ? '✓ API key will be included in code examples' : 'Leave empty if mock endpoint is not protected'}
                </Text>
              </Field.Root>
            </Box>

            <Tabs.Root value={activeTab} onValueChange={(e) => setActiveTab(e.value)}>
              <Tabs.List>
                <Tabs.Trigger value="curl">cURL</Tabs.Trigger>
                <Tabs.Trigger value="nodejs">Node.js</Tabs.Trigger>
                <Tabs.Trigger value="python">Python</Tabs.Trigger>
                <Tabs.Trigger value="go">Go</Tabs.Trigger>
              </Tabs.List>

              <Box mt={4} minH="280px">
                <Tabs.Content value="curl">
                  <Box position="relative">
                    <ClipboardRoot value={copyExamples.curl}>
                      <ClipboardTrigger asChild>
                        <IconButton
                          position="absolute"
                          top={2}
                          right={2}
                          size="sm"
                          variant="ghost"
                          colorPalette="gray"
                          aria-label="Copy code"
                        >
                          <LuCopy />
                        </IconButton>
                      </ClipboardTrigger>
                    </ClipboardRoot>
                    <Box
                      as="pre"
                      p={4}
                      bg="gray.50"
                      color="gray.800"
                      border="1px solid"
                      borderColor="gray.200"
                      borderRadius="md"
                      fontSize="sm"
                      fontFamily="monospace"
                      overflowX="auto"
                      minH="280px"
                    >
                      {examples.curl}
                    </Box>
                  </Box>
                </Tabs.Content>

                <Tabs.Content value="nodejs">
                  <Box position="relative">
                    <ClipboardRoot value={copyExamples.nodejs}>
                      <ClipboardTrigger asChild>
                        <IconButton
                          position="absolute"
                          top={2}
                          right={2}
                          size="sm"
                          variant="ghost"
                          colorPalette="gray"
                          aria-label="Copy code"
                        >
                          <LuCopy />
                        </IconButton>
                      </ClipboardTrigger>
                    </ClipboardRoot>
                    <Box
                      as="pre"
                      p={4}
                      bg="gray.50"
                      color="gray.800"
                      border="1px solid"
                      borderColor="gray.200"
                      borderRadius="md"
                      fontSize="sm"
                      fontFamily="monospace"
                      overflowX="auto"
                      minH="280px"
                    >
                      {examples.nodejs}
                    </Box>
                  </Box>
                </Tabs.Content>

                <Tabs.Content value="python">
                  <Box position="relative">
                    <ClipboardRoot value={copyExamples.python}>
                      <ClipboardTrigger asChild>
                        <IconButton
                          position="absolute"
                          top={2}
                          right={2}
                          size="sm"
                          variant="ghost"
                          colorPalette="gray"
                          aria-label="Copy code"
                        >
                          <LuCopy />
                        </IconButton>
                      </ClipboardTrigger>
                    </ClipboardRoot>
                    <Box
                      as="pre"
                      p={4}
                      bg="gray.50"
                      color="gray.800"
                      border="1px solid"
                      borderColor="gray.200"
                      borderRadius="md"
                      fontSize="sm"
                      fontFamily="monospace"
                      overflowX="auto"
                      minH="280px"
                    >
                      {examples.python}
                    </Box>
                  </Box>
                </Tabs.Content>

                <Tabs.Content value="go">
                  <Box position="relative">
                    <ClipboardRoot value={copyExamples.go}>
                      <ClipboardTrigger asChild>
                        <IconButton
                          position="absolute"
                          top={2}
                          right={2}
                          size="sm"
                          variant="ghost"
                          colorPalette="gray"
                          aria-label="Copy code"
                        >
                          <LuCopy />
                        </IconButton>
                      </ClipboardTrigger>
                    </ClipboardRoot>
                    <Box
                      as="pre"
                      p={4}
                      bg="gray.50"
                      color="gray.800"
                      border="1px solid"
                      borderColor="gray.200"
                      borderRadius="md"
                      fontSize="sm"
                      fontFamily="monospace"
                      overflowX="auto"
                      minH="280px"
                    >
                      {examples.go}
                    </Box>
                  </Box>
                </Tabs.Content>
              </Box>
            </Tabs.Root>
          </DialogBody>
          <DialogFooter>
            <DialogActionTrigger asChild>
              <Button variant="outline" size="sm">Close</Button>
            </DialogActionTrigger>
          </DialogFooter>
        </DialogContent>
      </Portal>
    </DialogRoot>
  );
}

CodeExamplesModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  api: PropTypes.object.isRequired
};

export default CodeExamplesModal;
