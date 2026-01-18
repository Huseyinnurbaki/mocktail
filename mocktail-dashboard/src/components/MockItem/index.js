import React from 'react';
import { Group, Text, Input, Button, Box } from '@chakra-ui/react';
import { RestProfiles } from '../../styles/profiles';
import PropTypes from 'prop-types';
import { showToast, TOASTTYPES } from '../../utils/toast';
import { PUBLIC_MOCKTAIL_URL } from '../../utils/paths';

const MockItem = (props) => {
  const { data, selected } = props;
  const { Method } = data;
  let endpoint = '/' + props.data.Endpoint;
  const fullUrl = `${PUBLIC_MOCKTAIL_URL}${endpoint}`;

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(fullUrl);
    showToast(TOASTTYPES.INFO, 'Copied', 1000);
  };

  const handleClick = () => {
    if (!props.disabled && props.onPressAction) {
      props.onPressAction(props.data);
    }
  };

  return (
    <Box
      onClick={handleClick}
      cursor={!props.disabled ? 'pointer' : 'default'}
      transition="all 0.2s"
    >
      <Group attached width="100%">
        <Box
          as="span"
          display="flex"
          alignItems="center"
          justifyContent="center"
          px={3}
          bg={RestProfiles[Method]}
          color="white"
          fontWeight="600"
          fontSize="xs"
          minW="70px"
          height="40px"
          borderTopLeftRadius="md"
          borderBottomLeftRadius="md"
        >
          {Method}
        </Box>
        <Input
          value={endpoint}
          readOnly
          fontSize="sm"
          fontFamily="mono"
          bg={selected ? 'blue.50' : 'white'}
          cursor={!props.disabled ? 'pointer' : 'default'}
          pointerEvents="none"
          _focus={{
            borderColor: 'gray.200',
            boxShadow: 'none'
          }}
        />
        <Button
          onClick={handleCopy}
          variant="outline"
          colorPalette="gray"
          height="40px"
          fontSize="sm"
        >
          Copy
        </Button>
      </Group>
    </Box>
  );
};

export default MockItem;

MockItem.propTypes = {
  data: PropTypes.any,
  Method: PropTypes.string,
  index: PropTypes.number,
  disabled: PropTypes.bool,
  selected: PropTypes.bool,
  onPressAction: PropTypes.func
};
