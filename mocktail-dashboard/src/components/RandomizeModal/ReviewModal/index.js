import React from 'react';
import {
  DialogRoot,
  DialogBackdrop,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  Button,
  VStack,
  HStack,
  Text,
  Box,
  Portal,
  DialogActionTrigger,
  Badge
} from '@chakra-ui/react';
import PropTypes from 'prop-types';

function ReviewModal({ isOpen, onClose, configurations, onRemove, onApply }) {
  const configList = Object.entries(configurations).filter(([_, config]) => config.type);

  const formatPath = (path) => {
    return path.replace('root.', '').replace(/\[\d+\]/g, '[*]');
  };

  const formatOptions = (options) => {
    return Object.entries(options)
      .filter(([_, v]) => v !== '' && v !== undefined && v !== null)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
  };

  return (
    <DialogRoot open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
      <Portal>
        <DialogBackdrop />
        <DialogContent
          position="fixed"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          maxW="700px"
          maxH="80vh"
          display="flex"
          flexDirection="column"
        >
          <DialogHeader>
            <DialogTitle>Review Changes</DialogTitle>
          </DialogHeader>

          <DialogBody flex="1" overflow="auto">
            {configList.length === 0 ? (
              <Box display="flex" alignItems="center" justifyContent="center" height="200px">
                <Text color="gray.500">No changes to review</Text>
              </Box>
            ) : (
              <VStack align="stretch" gap={1}>
                <Text fontSize="xs" color="gray.500" mb={1}>
                  {configList.length} field{configList.length !== 1 ? 's' : ''} configured
                </Text>

                {configList.map(([path, config]) => {
                  const optionsStr = config.options && Object.keys(config.options).length > 0
                    ? formatOptions(config.options)
                    : null;

                  return (
                    <HStack
                      key={path}
                      px={3}
                      py={2}
                      bg="gray.50"
                      borderRadius="md"
                      border="1px solid"
                      borderColor="gray.200"
                      justify="space-between"
                      align="center"
                      gap={3}
                    >
                      {/* Left: path + details */}
                      <VStack align="stretch" gap={0.5} flex="1" minW={0}>
                        <Text fontSize="xs" fontFamily="monospace" color="gray.700" fontWeight="medium" isTruncated>
                          {formatPath(path)}
                        </Text>
                        <HStack gap={1.5} flexWrap="wrap">
                          <Badge size="xs" colorPalette="blue" variant="subtle">
                            {config.type}
                          </Badge>
                          {config.applyToAll && (
                            <Badge size="xs" colorPalette="green" variant="subtle">
                              all items
                            </Badge>
                          )}
                          {config.applySameToAll && (
                            <Badge size="xs" colorPalette="teal" variant="subtle">
                              same value
                            </Badge>
                          )}
                          {config.updateReferences && (
                            <Badge size="xs" colorPalette="purple" variant="subtle">
                              refs
                            </Badge>
                          )}
                          {optionsStr && (
                            <Text fontSize="xs" color="gray.400">
                              {optionsStr}
                            </Text>
                          )}
                        </HStack>
                      </VStack>

                      {/* Right: remove */}
                      <Button
                        size="xs"
                        variant="ghost"
                        colorPalette="red"
                        flexShrink={0}
                        onClick={() => onRemove(path)}
                      >
                        ✕
                      </Button>
                    </HStack>
                  );
                })}
              </VStack>
            )}
          </DialogBody>

          <DialogFooter gap={2} justifyContent="space-between">
            <Button
              colorPalette="blue"
              size="sm"
              onClick={onApply}
              disabled={configList.length === 0}
            >
              Apply & Close
            </Button>
            <DialogActionTrigger asChild>
              <Button variant="outline" size="sm">
                Back
              </Button>
            </DialogActionTrigger>
          </DialogFooter>
        </DialogContent>
      </Portal>
    </DialogRoot>
  );
}

ReviewModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  configurations: PropTypes.object.isRequired,
  onRemove: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired
};

export default ReviewModal;
