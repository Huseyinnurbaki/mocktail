import React from 'react';
import { Box, HStack, Text, IconButton } from '@chakra-ui/react';
import { LuRefreshCw } from 'react-icons/lu';
import PropTypes from 'prop-types';

function PreviewBox({ value, onRegenerate, isObject = false, isGenerating = false }) {
  const displayValue = isObject
    ? JSON.stringify(value, null, 2)
    : String(value || '');

  return (
    <Box
      border="1px solid"
      borderColor="gray.200"
      borderRadius="md"
      bg="gray.50"
      p={3}
    >
      <HStack justify="space-between" mb={2}>
        <Text fontSize="sm" fontWeight="medium" color="gray.700">
          Preview
        </Text>
        <IconButton
          icon={<LuRefreshCw />}
          size="xs"
          variant="ghost"
          onClick={onRegenerate}
          aria-label="Regenerate preview"
          isDisabled={isGenerating}
          _hover={{ bg: 'gray.200' }}
        />
      </HStack>

      <Box
        as="pre"
        fontSize="sm"
        fontFamily="monospace"
        color="gray.800"
        whiteSpace={isObject ? 'pre-wrap' : 'nowrap'}
        overflowX="auto"
        maxH="200px"
        overflowY="auto"
        p={2}
        bg="white"
        borderRadius="sm"
        border="1px solid"
        borderColor="gray.100"
      >
        {displayValue || '(empty)'}
      </Box>
    </Box>
  );
}

PreviewBox.propTypes = {
  value: PropTypes.any,
  onRegenerate: PropTypes.func.isRequired,
  isObject: PropTypes.bool,
  isGenerating: PropTypes.bool
};

export default PreviewBox;
