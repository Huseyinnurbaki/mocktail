import React from 'react';
import { Row } from 'react-bootstrap';
import PropTypes from 'prop-types';

function BaseTab(props) {
  return <Row style={{ marginTop: '12px', marginBottom: '18px' }}>{props.children}</Row>;
}

export default BaseTab;

BaseTab.propTypes = {
  children: PropTypes.any
};
