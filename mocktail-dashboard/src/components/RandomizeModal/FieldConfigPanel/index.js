import React from 'react';
import { VStack, Text, Box, Button, HStack } from '@chakra-ui/react';
import PropTypes from 'prop-types';
import TypeSelector from './TypeSelector';
import OptionsForm from './OptionsForm';
import PreviewBox from './PreviewBox';
import { useFakerPreview } from '../../../hooks/useFakerPreview';

function FieldConfigPanel({
  path,
  currentValue,
  config,
  onChange,
  onReset,
  onKeepOriginal,
  canApplyToAll = false,
  onApplyToAll,
  similarFieldsCount = 0,
  isArrayItem = false
}) {
  const { preview, regenerate, isGenerating } = useFakerPreview({
    type: config?.type,
    options: config?.options,
    currentValue
  });

  const handleTypeChange = (type) => {
    onChange({
      ...config,
      type,
      options: {}
    });
  };

  const handleOptionsChange = (options) => {
    onChange({
      ...config,
      options
    });
  };

  const fieldName = path ? path.split('.').pop().replace(/\[\d+\]/, '') : '';

  return (
    <VStack align="stretch" gap={4} flex="1">
      {/* Field Path */}
      <Box>
        <Text fontSize="xs" color="gray.500" mb={1}>
          Field Path
        </Text>
        <Box
          p={2}
          bg="gray.50"
          borderRadius="md"
          border="1px solid"
          borderColor="gray.200"
        >
          <Text fontSize="sm" fontFamily="monospace" color="gray.700">
            {path || 'No field selected'}
          </Text>
        </Box>
      </Box>

      {/* Current Value */}
      <Box>
        <Text fontSize="xs" color="gray.500" mb={1}>
          Current Value
        </Text>
        <Box
          p={2}
          bg="gray.50"
          borderRadius="md"
          border="1px solid"
          borderColor="gray.200"
          maxH="100px"
          overflowY="auto"
        >
          <Text
            fontSize="sm"
            fontFamily="monospace"
            color="gray.700"
            whiteSpace="pre-wrap"
            wordBreak="break-all"
          >
            {typeof currentValue === 'object'
              ? JSON.stringify(currentValue, null, 2)
              : String(currentValue || '(empty)')}
          </Text>
        </Box>
      </Box>

      {/* Randomize Type */}
      <Box>
        <Text fontSize="xs" color="gray.500" mb={1}>
          Randomize Type
        </Text>
        <TypeSelector
          value={config?.type}
          onChange={handleTypeChange}
        />
      </Box>

      {/* Options Form */}
      {config?.type && config.type !== 'Keep Original' && (
        <OptionsForm
          type={config.type}
          options={config?.options}
          onChange={handleOptionsChange}
        />
      )}

      {/* Preview */}
      {config?.type && config.type !== 'Keep Original' && (
        <PreviewBox
          value={preview}
          onRegenerate={regenerate}
          isGenerating={isGenerating}
        />
      )}

      {/* Apply to All Checkbox */}
      {canApplyToAll && (
        <Box
          p={2}
          bg="gray.50"
          borderRadius="md"
          border="1px solid"
          borderColor="gray.200"
          cursor="pointer"
          onClick={() => onApplyToAll && onApplyToAll(!(config?.applyToAll || false))}
          _hover={{ bg: 'gray.100' }}
        >
          <HStack>
            <Box
              width="16px"
              height="16px"
              border="2px solid"
              borderColor="blue.500"
              borderRadius="sm"
              bg={config?.applyToAll ? 'blue.500' : 'white'}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              {config?.applyToAll && (
                <Text color="white" fontSize="xs">✓</Text>
              )}
            </Box>
            <Text fontSize="sm">
              {isArrayItem
                ? `Apply to all ${similarFieldsCount + 1} "${fieldName}" fields in array`
                : `Apply to ${similarFieldsCount} other "${fieldName}" field${similarFieldsCount !== 1 ? 's' : ''}`
              }
            </Text>
          </HStack>
        </Box>
      )}

      {/* Actions */}
      <HStack gap={2}>
        <Button
          variant="ghost"
          size="sm"
          onClick={onKeepOriginal}
          flex="1"
        >
          Keep Original
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          flex="1"
        >
          Reset
        </Button>
      </HStack>
    </VStack>
  );
}

FieldConfigPanel.propTypes = {
  path: PropTypes.string,
  currentValue: PropTypes.any,
  config: PropTypes.shape({
    type: PropTypes.string,
    options: PropTypes.object,
    applyToAll: PropTypes.bool
  }),
  onChange: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  onKeepOriginal: PropTypes.func.isRequired,
  canApplyToAll: PropTypes.bool,
  onApplyToAll: PropTypes.func,
  similarFieldsCount: PropTypes.number,
  isArrayItem: PropTypes.bool
};

export default FieldConfigPanel;
