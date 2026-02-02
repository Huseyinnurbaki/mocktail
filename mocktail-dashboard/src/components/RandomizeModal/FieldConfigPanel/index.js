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
  isArrayItem = false,
  referencedBy = [],
  referencesField = null,
  onUpdateReferences
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

  // Helper to format paths nicely for display
  const formatPathForDisplay = (pathStr) => {
    // Convert "root.items[0].links.parent_job_id" to "items[*].links.parent_job_id"
    return pathStr.replace('root.', '').replace(/\[\d+\]/g, '[*]');
  };

  return (
    <VStack align="stretch" gap={4} flex="1">
      {/* Field Path - Commented out since breadcrumb shows the path
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
      */}

      {/* Current Value - Commented out to save space
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
      */}

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

      {/* Referenced By - Show when this field is referenced by others */}
      {referencedBy.length > 0 && (
        <Box
          p={3}
          bg="purple.50"
          borderRadius="md"
          border="1px solid"
          borderColor="purple.200"
        >
          <VStack align="stretch" gap={2}>
            <HStack justify="space-between">
              <Text fontSize="xs" color="purple.700" fontWeight="medium">
                🔗 This value is referenced by {referencedBy.length} field{referencedBy.length !== 1 ? 's' : ''}
              </Text>
            </HStack>

            {/* List references */}
            <VStack align="stretch" gap={1} pl={2}>
              {referencedBy.map(refPath => (
                <Text key={refPath} fontSize="xs" fontFamily="monospace" color="gray.600">
                  • {formatPathForDisplay(refPath)}
                </Text>
              ))}
            </VStack>

            {/* Update References Checkbox */}
            {config?.type !== 'Keep Original' && (
              <Box
                p={2}
                bg="white"
                borderRadius="md"
                border="1px solid"
                borderColor="purple.300"
                cursor="pointer"
                onClick={() => onUpdateReferences && onUpdateReferences(!(config?.updateReferences || false))}
                _hover={{ bg: 'purple.100' }}
              >
                <HStack>
                  <Box
                    width="16px"
                    height="16px"
                    border="2px solid"
                    borderColor="purple.500"
                    borderRadius="sm"
                    bg={config?.updateReferences ? 'purple.500' : 'white'}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {config?.updateReferences && (
                      <Text color="white" fontSize="xs">✓</Text>
                    )}
                  </Box>
                  <Text fontSize="sm">
                    Update all {referencedBy.length} reference{referencedBy.length !== 1 ? 's' : ''} when randomizing
                  </Text>
                </HStack>
              </Box>
            )}
          </VStack>
        </Box>
      )}

      {/* References Field - Show when this field references another */}
      {referencesField && (
        <Box
          p={2}
          bg="blue.50"
          borderRadius="md"
          border="1px solid"
          borderColor="blue.200"
        >
          <Text fontSize="xs" color="blue.700">
            ℹ️ References: <Text as="span" fontFamily="monospace">{formatPathForDisplay(referencesField)}</Text>
          </Text>
        </Box>
      )}

      {/* Actions */}
      <HStack gap={2}>
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
    applyToAll: PropTypes.bool,
    updateReferences: PropTypes.bool
  }),
  onChange: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  onKeepOriginal: PropTypes.func.isRequired,
  canApplyToAll: PropTypes.bool,
  onApplyToAll: PropTypes.func,
  similarFieldsCount: PropTypes.number,
  isArrayItem: PropTypes.bool,
  referencedBy: PropTypes.arrayOf(PropTypes.string),
  referencesField: PropTypes.string,
  onUpdateReferences: PropTypes.func
};

export default FieldConfigPanel;
