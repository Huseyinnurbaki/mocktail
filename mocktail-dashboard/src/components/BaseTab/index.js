import React from 'react';
import { Box } from '@chakra-ui/react';
import PropTypes from 'prop-types';

function BaseTab(props) {
  return <Box mt="12px" mb="18px">{props.children}</Box>;
}

export default BaseTab;

BaseTab.propTypes = {
  children: PropTypes.any
};
