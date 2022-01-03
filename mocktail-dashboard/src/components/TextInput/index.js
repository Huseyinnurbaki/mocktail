import React from 'react';
import Form from 'react-bootstrap/Form';
import FormControl from 'react-bootstrap/FormControl';
import Col from 'react-bootstrap/Col';
import PropTypes from 'prop-types';

const TextInput = (props) => {
  return (
    <Col>
      <Form.Group>
        <Form.Label className="TextInputLabel">{props.label}</Form.Label>
        <FormControl
          {...props}
          as="textarea"
          rows="8"
          onInput={props.onChange}
          value={props.value}
          placeholder="{}"
        />
      </Form.Group>
    </Col>
  );
};

TextInput.propTypes = {
  label: PropTypes.string,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  value: PropTypes.any
};

export default TextInput;
