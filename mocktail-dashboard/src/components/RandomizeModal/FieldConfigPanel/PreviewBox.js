import React from 'react';
import { Box, HStack, Text, IconButton } from '@chakra-ui/react';
import { LuRefreshCw } from 'react-icons/lu';
import PropTypes from 'prop-types';

function PreviewBox({ value, onRegenerate, isObject = false, isGenerating = false }) {
  const displayValue = isObject
    ? JSON.stringify(value, null, 2)
    : String(value || '');

  return (
    <Box>
      <HStack justify="space-between" align="center" mb={1}>
        <Text fontSize="xs" color="gray.400" letterSpacing="wide">
          PREVIEW
        </Text>
        <IconButton
          icon={<LuRefreshCw size={11} />}
          size="2xs"
          variant="ghost"
          onClick={onRegenerate}
          aria-label="Regenerate preview"
          disabled={isGenerating}
          color="gray.400"
          _hover={{ color: 'gray.600', bg: 'transparent' }}
        />
      </HStack>

      <Box
        px={3}
        py={2}
        borderLeft="2px solid"
        borderColor="blue.200"
        bg="blue.50"
        borderRadius="0 4px 4px 0"
      >
        <Text
          fontSize="sm"
          fontFamily="monospace"
          color="gray.700"
          whiteSpace={isObject ? 'pre-wrap' : 'normal'}
          wordBreak="break-all"
          opacity={isGenerating ? 0.4 : 1}
          transition="opacity 0.15s"
        >
          {displayValue || '—'}
        </Text>
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
