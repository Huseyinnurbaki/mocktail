import React from 'react';
import { VStack, Text, Box, Input, Field, HStack, Badge } from '@chakra-ui/react';
import PropTypes from 'prop-types';
import { useArrayAnalysis } from '../../../hooks/useArrayAnalysis';
function ArrayConfigPanel({
  path,
  arrayData,
  config,
  onChange
}) {
  const analysis = useArrayAnalysis(arrayData);


  const getStatusBadge = (status) => {
    switch (status) {
      case 'all':
        return (
          <Badge size="xs" colorPalette="green" variant="subtle">
            All items
          </Badge>
        );
      case 'common':
        return (
          <Badge size="xs" colorPalette="blue" variant="subtle">
            Most items
          </Badge>
        );
      case 'rare':
        return (
          <Badge size="xs" colorPalette="orange" variant="subtle">
            Rare
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <VStack align="stretch" gap={4} flex="1">
      {/* Array Path */}
      <Box>
        <Text fontSize="xs" color="gray.500" mb={1}>
          Array Path
        </Text>
        <Box
          p={2}
          bg="gray.50"
          borderRadius="md"
          border="1px solid"
          borderColor="gray.200"
        >
          <Text fontSize="sm" fontFamily="monospace" color="gray.700">
            {path || 'No array selected'}
          </Text>
        </Box>
      </Box>

      {/* Current Length */}
      <Box>
        <Text fontSize="xs" color="gray.500" mb={1}>
          Current Length
        </Text>
        <HStack>
          <Box
            p={2}
            bg="gray.50"
            borderRadius="md"
            border="1px solid"
            borderColor="gray.200"
            flex="1"
          >
            <Text fontSize="sm" color="gray.700">
              {arrayData.length} items
              {analysis.isIrregular && (
                <Badge ml={2} size="xs" colorPalette="orange" variant="subtle">
                  irregular
                </Badge>
              )}
            </Text>
          </Box>
        </HStack>
      </Box>


      {/* Irregular Array Warning */}
      {analysis.isIrregular && analysis.fieldFrequency.length > 0 && (
        <Box
          p={3}
          bg="orange.50"
          borderRadius="md"
          border="1px solid"
          borderColor="orange.200"
        >
          <Text fontSize="xs" color="orange.700" mb={2} fontWeight="medium">
            ⚠️ This array has irregular structure
          </Text>
          <VStack align="stretch" gap={2}>
            {analysis.fieldFrequency.map(field => (
              <HStack key={field.name} justify="space-between">
                <Text fontSize="xs" fontFamily="monospace" color="gray.700">
                  {field.name}
                </Text>
                <HStack gap={1}>
                  <Text fontSize="xs" color="gray.500">
                    {field.count}/{analysis.totalItems}
                  </Text>
                  {getStatusBadge(field.status)}
                </HStack>
              </HStack>
            ))}
          </VStack>
        </Box>
      )}

      {/* Template Info */}
      <Box
        p={3}
        bg="blue.50"
        borderRadius="md"
        border="1px solid"
        borderColor="blue.200"
      >
        <Text fontSize="xs" color="blue.700">
          ℹ️ Click on fields inside [merged template] to configure how each field should be randomized.
        </Text>
      </Box>
    </VStack>
  );
}

ArrayConfigPanel.propTypes = {
  path: PropTypes.string,
  arrayData: PropTypes.array.isRequired,
  config: PropTypes.shape({
    targetLength: PropTypes.number,
    includedFields: PropTypes.array
  }),
  onChange: PropTypes.func.isRequired
};

ArrayConfigPanel.defaultProps = {
  config: {}
};

export default ArrayConfigPanel;
