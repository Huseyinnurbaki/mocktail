import React from 'react';
import { VStack, Input, Field, NativeSelectRoot, NativeSelectField, IconButton, HStack, Text, Box } from '@chakra-ui/react';
import { LuSettings } from 'react-icons/lu';
import PropTypes from 'prop-types';
import { useFakerConfig } from '../../../hooks/useFakerConfig';

function OptionsForm({ type, options, onChange }) {
  const config = useFakerConfig(type);
  const [expanded, setExpanded] = React.useState(true);

  if (!config || !config.options || config.options.length === 0) {
    return null;
  }

  // Merge with default options from config definition
  const defaultOpts = config.options.reduce((acc, opt) => {
    acc[opt.name] = opt.default;
    return acc;
  }, {});

  const currentOptions = { ...defaultOpts, ...options };

  const handleOptionChange = (name, value) => {
    onChange({
      ...currentOptions,
      [name]: value
    });
  };

  const renderControl = (opt) => {
    const value = currentOptions[opt.name] !== undefined
      ? currentOptions[opt.name]
      : opt.default;

    switch (opt.type) {
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleOptionChange(opt.name, Number(e.target.value))}
            size="sm"
          />
        );

      case 'text':
        return (
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => handleOptionChange(opt.name, e.target.value)}
            placeholder={opt.placeholder}
            size="sm"
          />
        );

      case 'select':
        return (
          <NativeSelectRoot>
            <NativeSelectField
              value={value}
              onChange={(e) => {
                const val = opt.options[0] === 0 || typeof opt.options[0] === 'number'
                  ? Number(e.target.value)
                  : e.target.value;
                handleOptionChange(opt.name, val);
              }}
              size="sm"
            >
              {opt.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </NativeSelectField>
          </NativeSelectRoot>
        );

      case 'boolean':
        return (
          <Box
            onClick={() => handleOptionChange(opt.name, !value)}
            cursor="pointer"
            p={2}
            borderRadius="md"
            _hover={{ bg: 'gray.100' }}
          >
            <HStack>
              <Box
                width="16px"
                height="16px"
                border="2px solid"
                borderColor="blue.500"
                borderRadius="sm"
                bg={value ? 'blue.500' : 'white'}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                {value && (
                  <Text color="white" fontSize="xs">✓</Text>
                )}
              </Box>
              <Text fontSize="sm">{opt.label}</Text>
            </HStack>
          </Box>
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => handleOptionChange(opt.name, e.target.value)}
            size="sm"
          />
        );

      default:
        return null;
    }
  };

  return (
    <VStack align="stretch" gap={2}>
      <HStack justify="space-between" align="center">
        <Text fontSize="sm" fontWeight="medium" color="gray.700">
          Options
        </Text>
        <IconButton
          icon={<LuSettings />}
          size="xs"
          variant="ghost"
          onClick={() => setExpanded(!expanded)}
          aria-label={expanded ? "Collapse options" : "Expand options"}
        />
      </HStack>

      {expanded && (
        <VStack align="stretch" gap={3} p={3} bg="gray.50" borderRadius="md">
          {config.options.map((opt) => {
            // Check if this option should be shown based on showWhen condition
            if (opt.showWhen) {
              const conditionMet = Object.entries(opt.showWhen).every(
                ([key, value]) => currentOptions[key] === value
              );
              if (!conditionMet) return null;
            }

            return (
              <Field.Root key={opt.name}>
                {opt.type !== 'boolean' && (
                  <Field.Label fontSize="xs" mb={1}>
                    {opt.label}
                  </Field.Label>
                )}
                {renderControl(opt)}
              </Field.Root>
            );
          })}
        </VStack>
      )}
    </VStack>
  );
}

OptionsForm.propTypes = {
  type: PropTypes.string.isRequired,
  options: PropTypes.object,
  onChange: PropTypes.func.isRequired
};

export default OptionsForm;
