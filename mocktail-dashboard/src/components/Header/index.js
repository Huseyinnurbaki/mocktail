import React, { useEffect, useState } from 'react';
import { Container, Flex, Image, Text, Box, Link, Button, DialogRoot, DialogTrigger, DialogContent, DialogHeader, DialogBody, DialogCloseTrigger, DialogTitle, DialogBackdrop, VStack, Portal } from '@chakra-ui/react';
import { APP_VERSION } from '../../utils/appVersion';
import { GITHUB_RELEASES } from '../../utils/paths';
import { get } from '../../utils/request';

const Header = () => {
  const [latestVersion, setLatestVersion] = useState(null);

  useEffect(() => {
    async function getLatestGitHubReleaseVersion() {
      const versions = await get(GITHUB_RELEASES);
      setLatestVersion(versions?.[0]?.tag_name);
    }
    getLatestGitHubReleaseVersion();
  }, []);

  const isNewerVersionAvailable = () => {
    if (!latestVersion) return false;
    const current = APP_VERSION.replace(/^v/, '');
    const latest = latestVersion.replace(/^v/, '');
    return latest !== current;
  };

  return (
    <Container maxW="container.xl" py={4}>
      <Flex direction="column" align="center" gap={2}>
        <Image
          src="./header.webp"
          className="headerimg"
          alt="Mocktail"
          h="100px"
        />
        <Flex align="center" gap={2} fontSize="xs" color="gray.500">
          <DialogRoot>
            <DialogTrigger asChild>
              <Box
                as="button"
                fontSize="xs"
                color="blue.500"
                cursor="pointer"
                _hover={{ textDecoration: 'underline' }}
              >
                Guide
              </Box>
            </DialogTrigger>
            <Portal>
              <DialogBackdrop />
              <DialogContent
                position="fixed"
                top="50%"
                left="50%"
                transform="translate(-50%, -50%)"
                zIndex="modal"
                maxW="500px"
              >
                <DialogHeader>
                  <DialogTitle>How to Use Mocktail</DialogTitle>
                </DialogHeader>
                <DialogBody pb={6}>
                  <VStack align="stretch" gap={3} fontSize="sm">
                    <Box>
                      <Text fontWeight="semibold" mb={1}>1. Create Tab - Choose HTTP Method</Text>
                      <Text color="gray.600">Select GET, POST, PUT, PATCH, or DELETE from the dropdown.</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="semibold" mb={1}>2. Define Your Endpoint</Text>
                      <Text color="gray.600">Enter your endpoint path (e.g., "users/123" or "api/products").</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="semibold" mb={1}>3. Create Response Body</Text>
                      <Text color="gray.600">Paste or type your JSON response. It auto-beautifies on paste. Use Beautify, Validate, or Clear buttons as needed.</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="semibold" mb={1}>4. Save Your Mock</Text>
                      <Text color="gray.600">Click Save to create your mock endpoint. It will appear in the Catalog tab.</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="semibold" mb={1}>5. Catalog Tab - Manage & Test</Text>
                      <Text color="gray.600">Click any endpoint to view details. Use Copy to copy the endpoint path, Test Endpoint to verify it works, or Delete to remove it.</Text>
                    </Box>
                  </VStack>
                </DialogBody>
                <DialogCloseTrigger />
              </DialogContent>
            </Portal>
          </DialogRoot>

          <Text>v{APP_VERSION}</Text>
          {isNewerVersionAvailable() && (
            <Link
              href="https://github.com/Huseyinnurbaki/mocktail/releases"
              isExternal
              display="flex"
              alignItems="center"
              gap={1}
              color="blue.500"
              _hover={{ color: 'blue.600' }}
            >
              <Box
                w="8px"
                h="8px"
                bg="blue.500"
                borderRadius="full"
              />
              <Text fontSize="xs">New version available</Text>
            </Link>
          )}
        </Flex>
      </Flex>
    </Container>
  );
};

export default Header;
