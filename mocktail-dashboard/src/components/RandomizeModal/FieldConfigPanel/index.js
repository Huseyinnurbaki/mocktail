import React from 'react';
import { VStack, Text, Box, Button, HStack, Textarea, NativeSelectRoot, NativeSelectField } from '@chakra-ui/react';
import PropTypes from 'prop-types';
import TypeSelector from './TypeSelector';
import OptionsForm from './OptionsForm';
import PreviewBox from './PreviewBox';
import { useFakerPreview } from '../../../hooks/useFakerPreview';

function CheckRow({ checked, onChange, disabled = false, children }) {
  return (
    <HStack
      px={3}
      py={2}
      cursor={disabled ? 'not-allowed' : 'pointer'}
      opacity={disabled ? 0.5 : 1}
      bg={checked ? 'blue.50' : 'white'}
      _hover={{ bg: disabled ? undefined : checked ? 'blue.50' : 'gray.50' }}
      onClick={disabled ? undefined : onChange}
      gap={2.5}
    >
      <Box
        width="15px"
        height="15px"
        border="1.5px solid"
        borderColor={checked ? 'blue.500' : 'gray.300'}
        borderRadius="3px"
        bg={checked ? 'blue.500' : 'white'}
        display="flex"
        alignItems="center"
        justifyContent="center"
        flexShrink={0}
        transition="all 0.1s"
      >
        {checked && <Text color="white" fontSize="9px" lineHeight="1">✓</Text>}
      </Box>
      <Text fontSize="xs" color={checked ? 'blue.700' : 'gray.600'}>
        {children}
      </Text>
    </HStack>
  );
}

const AI_PROVIDERS = {
  OpenAI: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  Anthropic: ['claude-opus-4-6', 'claude-sonnet-4-6', 'claude-haiku-4-5'],
  Google: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
};

function FieldConfigPanel({
  path,
  currentValue,
  config,
  onChange,
  onReset,
  canApplyToAll = false,
  onApplyToAll,
  onApplySameToAll,
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
      options: {},
    });
  };

  const handleOptionsChange = (options) => {
    onChange({
      ...config,
      options
    });
  };

  const fieldName = path ? path.split('.').pop().replace(/\[\d+\]/, '') : '';

  const formatPathForDisplay = (pathStr) => {
    return pathStr.replace('root.', '').replace(/\[\d+\]/g, '[*]');
  };

  return (
    <HStack align="stretch" gap={0} flex="1" minH={0}>
      {/* Left: config options */}
      <VStack
        align="stretch"
        gap={3}
        flex="1"
        pr={4}
        borderRight="1px solid"
        borderColor="gray.200"
        overflowY="auto"
        minH={0}
      >
        {config?.type === 'Custom' ? (
          <VStack align="stretch" gap={2}>
            <Text fontSize="xs" color="gray.500">Value</Text>
            <Textarea
              value={config?.options?.customValue || ''}
              onChange={(e) => handleOptionsChange({ ...config?.options, customValue: e.target.value })}
              placeholder="Enter a fixed value..."
              size="sm"
              rows={3}
              minH="72px"
              maxH="72px"
              resize="none"
              fontFamily="monospace"
            />
          </VStack>
        ) : config?.type === 'AI Generate' ? (
          <Box border="1px solid" borderColor="gray.200" borderRadius="md" overflow="hidden">
            <HStack
              px={2}
              py={1}
              bg="gray.50"
              borderBottom="1px solid"
              borderColor="gray.200"
              gap={1}
            >
              <Box
                as="select"
                fontSize="10px"
                color="gray.500"
                bg="transparent"
                border="none"
                outline="none"
                cursor="pointer"
                value={config?.options?.aiProvider || 'OpenAI'}
                onChange={(e) => {
                  const provider = e.target.value;
                  const firstModel = AI_PROVIDERS[provider][0];
                  handleOptionsChange({ ...config?.options, aiProvider: provider, aiModel: firstModel });
                }}
                _hover={{ color: 'gray.700' }}
              >
                {Object.keys(AI_PROVIDERS).map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </Box>
              <Text fontSize="10px" color="gray.300">/</Text>
              <Box
                as="select"
                fontSize="10px"
                color="gray.500"
                bg="transparent"
                border="none"
                outline="none"
                cursor="pointer"
                value={config?.options?.aiModel || AI_PROVIDERS['OpenAI'][0]}
                onChange={(e) => handleOptionsChange({ ...config?.options, aiModel: e.target.value })}
                _hover={{ color: 'gray.700' }}
              >
                {(AI_PROVIDERS[config?.options?.aiProvider || 'OpenAI'] || []).map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </Box>
            </HStack>
            <Textarea
              value={config?.options?.prompt || ''}
              onChange={(e) => handleOptionsChange({ ...config?.options, prompt: e.target.value })}
              placeholder="Describe the value to generate..."
              size="sm"
              rows={3}
              minH="72px"
              maxH="72px"
              resize="none"
              border="none"
              borderRadius="0"
              outline="none"
              _focus={{ boxShadow: 'none', borderColor: 'transparent', outline: 'none' }}
              _focusVisible={{ boxShadow: 'none', borderColor: 'transparent', outline: 'none' }}
            />
          </Box>
        ) : config?.type ? (
          <>
            <OptionsForm
              type={config.type}
              options={config?.options}
              onChange={handleOptionsChange}
            />
            <PreviewBox
              value={preview}
              onRegenerate={regenerate}
              isGenerating={isGenerating}
            />
          </>
        ) : (
          <Box display="flex" alignItems="center" justifyContent="center" flex="1">
            <Text color="gray.400" fontSize="sm">
              Select a type →
            </Text>
          </Box>
        )}

        {/* Apply to All */}
        {config?.type && canApplyToAll && (
          <VStack align="stretch" gap={0} borderRadius="md" border="1px solid" borderColor="gray.200" overflow="hidden">
            <CheckRow
              checked={config?.applyToAll || false}
              onChange={() => onApplyToAll && onApplyToAll(!(config?.applyToAll || false))}
            >
              {isArrayItem
                ? `Apply to all ${similarFieldsCount + 1} "${fieldName}" fields`
                : `Apply to ${similarFieldsCount} other "${fieldName}" field${similarFieldsCount !== 1 ? 's' : ''}`
              }
            </CheckRow>
            <Box borderTop="1px solid" borderColor="gray.200" />
            <CheckRow
              checked={config?.applySameToAll || false}
              onChange={() => config?.type !== 'Custom' && onApplySameToAll && onApplySameToAll(!(config?.applySameToAll || false))}
              disabled={config?.type === 'Custom'}
            >
              Apply <Text as="span" fontWeight="semibold">same</Text> value to all
            </CheckRow>
          </VStack>
        )}

        {/* Referenced By */}
        {referencedBy.length > 0 && (
          <Box
            p={3}
            bg="purple.50"
            borderRadius="md"
            border="1px solid"
            borderColor="purple.200"
          >
            <VStack align="stretch" gap={2}>
              <Text fontSize="xs" color="purple.700" fontWeight="medium">
                🔗 Referenced by {referencedBy.length} field{referencedBy.length !== 1 ? 's' : ''}
              </Text>
              <VStack align="stretch" gap={1} pl={2}>
                {referencedBy.map(refPath => (
                  <Text key={refPath} fontSize="xs" fontFamily="monospace" color="gray.600">
                    • {formatPathForDisplay(refPath)}
                  </Text>
                ))}
              </VStack>
              <CheckRow
                checked={config?.updateReferences || false}
                onChange={() => onUpdateReferences && onUpdateReferences(!(config?.updateReferences || false))}
              >
                Update {referencedBy.length} reference{referencedBy.length !== 1 ? 's' : ''} when randomizing
              </CheckRow>
            </VStack>
          </Box>
        )}

        {/* References Field */}
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

        {config?.type && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
          >
            Reset
          </Button>
        )}
      </VStack>

      {/* Right: type selector */}
      <Box width="220px" pl={4} display="flex" flexDirection="column" minH={0}>
        {/* <Text fontSize="xs" color="gray.500" fontWeight="medium" mb={2} flexShrink={0}>
          Type
        </Text> */}
        <Box flex="1" minH={0} overflowY="auto" border="1px solid" borderColor="gray.200" borderRadius="md">
          <TypeSelector
            value={config?.type}
            onChange={handleTypeChange}
          />
        </Box>
      </Box>
    </HStack>
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
  canApplyToAll: PropTypes.bool,
  onApplyToAll: PropTypes.func,
  onApplySameToAll: PropTypes.func,
  similarFieldsCount: PropTypes.number,
  isArrayItem: PropTypes.bool,
  referencedBy: PropTypes.arrayOf(PropTypes.string),
  referencesField: PropTypes.string,
  onUpdateReferences: PropTypes.func
};

export default FieldConfigPanel;
