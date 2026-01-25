import React from 'react';
import { NativeSelectRoot, NativeSelectField } from '@chakra-ui/react';
import PropTypes from 'prop-types';
import { getCategories } from '../../../utils/fakerConfigs';

function TypeSelector({ value, onChange }) {
  const categories = getCategories();

  return (
    <NativeSelectRoot>
      <NativeSelectField
        value={value || 'Keep Original'}
        onChange={(e) => onChange(e.target.value)}
        size="sm"
      >
        {Object.entries(categories).map(([category, types]) => (
          <optgroup key={category} label={category}>
            {types.map(type => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </optgroup>
        ))}
      </NativeSelectField>
    </NativeSelectRoot>
  );
}

TypeSelector.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired
};

export default TypeSelector;
