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
  const configList = Object.entries(configurations).filter(([_, config]) => config.type && config.type !== 'Keep Original');

  const formatPath = (path) => {
    return path.replace('root.', '').replace(/\[\d+\]/g, '[*]');
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
          maxW="800px"
          maxH="80vh"
          display="flex"
          flexDirection="column"
        >
          <DialogHeader>
            <DialogTitle>Review Changes</DialogTitle>
          </DialogHeader>

          <DialogBody flex="1" overflow="auto">
            {configList.length === 0 ? (
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                height="200px"
              >
                <Text color="gray.500">No changes to review</Text>
              </Box>
            ) : (
              <VStack align="stretch" gap={2}>
                <Text fontSize="sm" color="gray.600" mb={2}>
                  {configList.length} field{configList.length !== 1 ? 's' : ''} configured for randomization
                </Text>

                {configList.map(([path, config]) => (
                  <Box
                    key={path}
                    p={3}
                    bg="gray.50"
                    borderRadius="md"
                    border="1px solid"
                    borderColor="gray.200"
                  >
                    <HStack justify="space-between" mb={2}>
                      <Text fontSize="sm" fontFamily="monospace" color="gray.700" fontWeight="medium">
                        {formatPath(path)}
                      </Text>
                      <Button
                        size="xs"
                        variant="ghost"
                        colorPalette="red"
                        onClick={() => onRemove(path)}
                      >
                        Remove
                      </Button>
                    </HStack>

                    <HStack gap={2} flexWrap="wrap">
                      <Badge size="sm" colorPalette="blue" variant="subtle">
                        Type: {config.type}
                      </Badge>

                      {config.applyToAll && (
                        <Badge size="sm" colorPalette="green" variant="subtle">
                          ✓ Apply to All
                        </Badge>
                      )}

                      {config.updateReferences && (
                        <Badge size="sm" colorPalette="purple" variant="subtle">
                          🔗 Update References
                        </Badge>
                      )}
                    </HStack>

                    {config.options && Object.keys(config.options).length > 0 && (
                      <Box mt={2}>
                        <Text fontSize="xs" color="gray.500">
                          Options: {JSON.stringify(config.options)}
                        </Text>
                      </Box>
                    )}
                  </Box>
                ))}
              </VStack>
            )}
          </DialogBody>

          <DialogFooter gap={2}>
            <DialogActionTrigger asChild>
              <Button variant="outline" size="sm">
                Back
              </Button>
            </DialogActionTrigger>
            <Button
              colorPalette="blue"
              size="sm"
              onClick={onApply}
              disabled={configList.length === 0}
            >
              Apply Changes
            </Button>
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
