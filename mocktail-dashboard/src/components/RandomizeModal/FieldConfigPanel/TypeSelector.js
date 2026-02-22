import React from 'react';
import { Box, HStack, Text } from '@chakra-ui/react';
import PropTypes from 'prop-types';
import { getCategories, fakerConfigs } from '../../../utils/fakerConfigs';

const SPECIAL_TYPES = [
  { type: 'Custom', icon: '✏️', description: 'Fixed value' },
  { type: 'AI Generate', icon: '✨', description: 'Prompt-based' },
];

function TypeSelector({ value, onChange }) {
  const categories = getCategories();

  return (
    <Box>
      {/* Special types at top */}
      <Text fontSize="xs" color="gray.500" fontWeight="medium" px={3} py={1} bg="gray.50" position="sticky" top={0} zIndex={1}>
        Special
      </Text>
      {SPECIAL_TYPES.map(({ type, icon }) => {
        const isSelected = value === type;
        return (
          <HStack
            key={type}
            px={3}
            py={1.5}
            cursor="pointer"
            bg={isSelected ? 'blue.50' : 'white'}
            _hover={{ bg: isSelected ? 'blue.50' : 'gray.50' }}
            onClick={() => onChange(type)}
            gap={2}
          >
            <Text fontSize="sm" width="18px" textAlign="center">{icon}</Text>
            <Text fontSize="sm" color={isSelected ? 'blue.700' : 'gray.700'} fontWeight="normal">
              {type}
            </Text>
          </HStack>
        );
      })}

      {/* Faker categories */}
      {Object.entries(categories).map(([category, types]) => (
        <Box key={category}>
          <Text fontSize="xs" color="gray.500" fontWeight="medium" px={3} py={1} bg="gray.50" position="sticky" top={0} zIndex={1}>
            {category}
          </Text>
          {types.map(type => {
            const conf = fakerConfigs[type];
            const isSelected = value === type;
            return (
              <HStack
                key={type}
                px={3}
                py={1.5}
                cursor="pointer"
                bg={isSelected ? 'blue.50' : 'white'}
                _hover={{ bg: isSelected ? 'blue.50' : 'gray.50' }}
                onClick={() => onChange(type)}
                gap={2}
              >
                <Text fontSize="sm" width="18px" textAlign="center">{conf?.icon}</Text>
                <Text fontSize="sm" color={isSelected ? 'blue.700' : 'gray.700'} fontWeight="normal">
                  {type}
                </Text>
              </HStack>
            );
          })}
        </Box>
      ))}
    </Box>
  );
}

TypeSelector.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired
};

export default TypeSelector;
