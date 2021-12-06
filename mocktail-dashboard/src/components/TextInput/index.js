import React from "react"
import Form from "react-bootstrap/Form"
import Col from "react-bootstrap/Col"
import PropTypes from "prop-types"

const TextInput = (props) => {
  return (
    <Col>
      <Form.Group controlId="exampleForm.ControlTextarea1">
        <Form.Label className="TextInputLabel">{props.label}</Form.Label>
        <Form.Control
          {...props}
          as="textarea"
          rows="8"
          onInput={props.onChange}
          value={props.disabled ? props.value : undefined}
        />
      </Form.Group>
    </Col>
  )
}

TextInput.propTypes = {
  label: PropTypes.string,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  value: PropTypes.object,
}

export default TextInput
