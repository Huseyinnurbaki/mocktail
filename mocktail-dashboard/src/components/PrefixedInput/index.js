import React from 'react';
import { Field, Box, Group, Input } from '@chakra-ui/react';
import { PUBLIC_MOCKTAIL_URL } from '../../utils/paths';
import PropTypes from 'prop-types';

const PrefixedInput = (props) => {
  const { HTTP_METHODS, selectedMethod, setSelectedMethod } = props;

  return (
    <Field.Root mb={4}>
      <Field.Label fontSize="sm" fontWeight="medium" mb={2}>
        Choose HTTP method and endpoint path
      </Field.Label>
      <Group attached width="100%">
        <Box
          as="select"
          value={selectedMethod}
          onChange={(e) => setSelectedMethod(e.target.value)}
          minWidth="90px"
          px="10px"
          fontSize="sm"
          fontWeight="semibold"
          bg="white"
          color="gray.900"
          border="1px solid"
          borderColor="gray.300"
          cursor="pointer"
          appearance="auto"
          height="40px"
          _hover={{
            borderColor: 'gray.400',
            bg: 'gray.50'
          }}
          _focus={{
            outline: 'none',
            borderColor: 'blue.500',
            zIndex: 1
          }}
        >
          {Object.keys(HTTP_METHODS).map((method) => (
            <option key={method} value={method}>
              {method}
            </option>
          ))}
        </Box>

        <Box
          px={3}
          display="flex"
          alignItems="center"
          bg="gray.50"
          fontSize="sm"
          color="gray.600"
          whiteSpace="nowrap"
          border="1px solid"
          borderColor="gray.300"
          height="40px"
          minWidth="220px"
        >
          {PUBLIC_MOCKTAIL_URL}/
        </Box>

        <Input
          onChange={props.onChange}
          value={props.value}
          autoComplete="off"
          required={props.required}
          placeholder="your-endpoint"
          fontSize="sm"
          flex="1"
        />
      </Group>
    </Field.Root>
  );
};

export default PrefixedInput;

PrefixedInput.propTypes = {
  onChange: PropTypes.func,
  value: PropTypes.any,
  setSelectedMethod: PropTypes.func,
  HTTP_METHODS: PropTypes.object,
  selectedMethod: PropTypes.string,
  required: PropTypes.bool
};
