import React from "react"
import InputGroup from "react-bootstrap/InputGroup"
import FormControl from "react-bootstrap/FormControl"
import Col from "react-bootstrap/Col"

const PrefixedInput = (props) => {
  return (
    <Col>
      <label htmlFor="basic-url">Your Mock Endpoint</label>
      <InputGroup className="mb-3">
        <InputGroup.Prepend>
          <InputGroup.Text id="basic-addon3">
            http://localhost:7080/mocktail/
          </InputGroup.Text>
        </InputGroup.Prepend>
        <FormControl
          id="basic-url"
          aria-describedby="basic-addon3"
          onChange={props.onChange}
          autoComplete="off"
        />
      </InputGroup>
    </Col>
  )
}

export default PrefixedInput

// formlar düzenleencek. validasonlar formlarla yapılcak
