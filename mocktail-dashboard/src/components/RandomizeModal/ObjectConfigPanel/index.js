import React from 'react';
import { VStack, Text, Box, HStack } from '@chakra-ui/react';
import PropTypes from 'prop-types';

function ObjectConfigPanel({ path, objectData }) {
  const fieldCount = Object.keys(objectData).length;

  return (
    <VStack align="stretch" gap={4} flex="1">
      {/* Object Path */}
      <Box>
        <Text fontSize="xs" color="gray.500" mb={1}>
          Object Path
        </Text>
        <Box
          p={2}
          bg="gray.50"
          borderRadius="md"
          border="1px solid"
          borderColor="gray.200"
        >
          <Text fontSize="sm" fontFamily="monospace" color="gray.700">
            {path || 'No object selected'}
          </Text>
        </Box>
      </Box>

      {/* Field Count */}
      <Box>
        <Text fontSize="xs" color="gray.500" mb={1}>
          Fields
        </Text>
        <Box
          p={2}
          bg="gray.50"
          borderRadius="md"
          border="1px solid"
          borderColor="gray.200"
        >
          <Text fontSize="sm" color="gray.700">
            {fieldCount} field{fieldCount !== 1 ? 's' : ''}
          </Text>
        </Box>
      </Box>

      {/* Field List */}
      <Box
        p={3}
        bg="blue.50"
        borderRadius="md"
        border="1px solid"
        borderColor="blue.200"
      >
        <Text fontSize="xs" color="blue.700" mb={2} fontWeight="medium">
          📦 Object Structure
        </Text>
        <VStack align="stretch" gap={1}>
          {Object.entries(objectData).map(([key, value]) => {
            const valuePreview = typeof value === 'object' && value !== null
              ? Array.isArray(value)
                ? `[${value.length} items]`
                : '{...}'
              : String(value).length > 30
              ? String(value).substring(0, 30) + '...'
              : String(value);

            return (
              <HStack key={key} justify="space-between" gap={2}>
                <Text fontSize="xs" fontFamily="monospace" color="gray.700" fontWeight="medium">
                  {key}
                </Text>
                <Text fontSize="xs" fontFamily="monospace" color="gray.500" noOfLines={1}>
                  {valuePreview}
                </Text>
              </HStack>
            );
          })}
        </VStack>
      </Box>

      {/* Template Info */}
      <Box
        p={3}
        bg="blue.50"
        borderRadius="md"
        border="1px solid"
        borderColor="blue.200"
      >
        <Text fontSize="xs" color="blue.700">
          ℹ️ Click on individual fields in the tree to configure how each should be randomized.
        </Text>
      </Box>
    </VStack>
  );
}

ObjectConfigPanel.propTypes = {
  path: PropTypes.string,
  objectData: PropTypes.object.isRequired
};

export default ObjectConfigPanel;
