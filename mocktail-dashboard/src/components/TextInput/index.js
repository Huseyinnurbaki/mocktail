import React from 'react';
import { Field, Textarea, Flex, Box } from '@chakra-ui/react';
import PropTypes from 'prop-types';

const placeholder = {
  "message": "Enter your JSON response here",
  "example": {
    "id": 1,
    "name": "Sample Data"
  }
};

const TextInput = (props) => {
  const { error, success, headerActions, ...textareaProps } = props;

  return (
    <Field.Root mb={4}>
      {props.label && (
        <Field.Label fontSize="sm" fontWeight="medium" mb={2}>
          {props.label}
        </Field.Label>
      )}
      <Box width="100%">
        {headerActions && (
          <Flex
            justify="flex-start"
            align="center"
            px={2}
            py={1}
            bg="gray.50"
            borderTopRadius="md"
            borderLeft="1px solid"
            borderRight="1px solid"
            borderTop="1px solid"
            borderBottom="1px solid"
            borderColor="gray.200"
            width="100%"
            boxSizing="border-box"
          >
            {headerActions}
          </Flex>
        )}
        <Textarea
          {...textareaProps}
          rows={12}
          onInput={props.onChange}
          value={props.value}
          placeholder={JSON.stringify(placeholder, 0, 2)}
          fontSize="sm"
          fontFamily="mono"
          width="100%"
          borderTopRadius={headerActions ? '0' : 'md'}
          overflowY="auto"
          resize="none"
          {...(headerActions && {
            borderTopWidth: '0'
          })}
          _focus={{
            borderColor: 'gray.200',
            borderWidth: '1px',
            boxShadow: 'none',
            outline: 'none',
            ...(headerActions && {
              borderTopWidth: '0'
            })
          }}
          _focusVisible={{
            borderColor: 'gray.200',
            borderWidth: '1px',
            boxShadow: 'none',
            outline: 'none',
            ...(headerActions && {
              borderTopWidth: '0'
            })
          }}
        />
      </Box>
      <Box
        color={success ? 'green.500' : 'red.500'}
        fontSize="xs"
        mt={2}
        minH="20px"
        pl={2}
      >
        {error || success || ' '}
      </Box>
    </Field.Root>
  );
};

TextInput.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string,
  onChange: PropTypes.func,
  onPaste: PropTypes.func,
  onBlur: PropTypes.func,
  disabled: PropTypes.bool,
  value: PropTypes.any,
  error: PropTypes.string,
  success: PropTypes.string,
  headerActions: PropTypes.node
};

export default TextInput;
