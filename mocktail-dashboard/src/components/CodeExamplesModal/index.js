import React, { useState } from 'react';
import { Box, Button, DialogRoot, DialogBackdrop, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogActionTrigger, DialogTitle, Portal, Tabs, Code, ClipboardRoot, ClipboardTrigger, IconButton } from '@chakra-ui/react';
import PropTypes from 'prop-types';
import { PUBLIC_MOCKTAIL_URL } from '../../utils/paths';
import { LuCopy } from 'react-icons/lu';

function CodeExamplesModal({ isOpen, onClose, api }) {
  const [activeTab, setActiveTab] = useState('curl');

  const fullUrl = `${PUBLIC_MOCKTAIL_URL}/${api.Endpoint}`;

  const examples = {
    curl: `curl -X ${api.Method} '${fullUrl}' \\
  -H 'Content-Type: application/json'`,

    nodejs: `const axios = require('axios');

const response = await axios.${api.Method.toLowerCase()}('${fullUrl}', {
  headers: {
    'Content-Type': 'application/json'
  }
});

console.log(response.data);`,

    python: `import requests

response = requests.${api.Method.toLowerCase()}('${fullUrl}',
    headers={'Content-Type': 'application/json'}
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
    req.Header.Set("Content-Type", "application/json")

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
                    <ClipboardRoot value={examples.curl}>
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
                    <ClipboardRoot value={examples.nodejs}>
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
                    <ClipboardRoot value={examples.python}>
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
                    <ClipboardRoot value={examples.go}>
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
