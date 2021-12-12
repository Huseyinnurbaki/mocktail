import React from 'react';
import InputGroup from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';
import Col from 'react-bootstrap/Col';
import { API_MOCKTAIL_URL } from '../../utils/paths';
import PropTypes from 'prop-types';

const PrefixedInput = (props) => {
  return (
    <Col>
      <label htmlFor="basic-url">Your Mock Endpoint</label>
      <InputGroup className="mb-3">
        <InputGroup.Text id="basic-addon3">{API_MOCKTAIL_URL}</InputGroup.Text>
        <FormControl
          id="basic-url"
          aria-describedby="basic-addon3"
          onChange={props.onChange}
          autoComplete="off"
        />
      </InputGroup>
    </Col>
  );
};

export default PrefixedInput;

PrefixedInput.propTypes = {
  onChange: PropTypes.func
};
