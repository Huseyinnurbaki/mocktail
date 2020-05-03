import React from "react"
import InputGroup from "react-bootstrap/InputGroup"
import FormControl from "react-bootstrap/FormControl"
import Button from "react-bootstrap/Button"

const MockItem = (props) => {
  let method = props.data.method.toString().toUpperCase()
  let bgc = "orange"
  if (method === "GET") {
    bgc = "#17b027"
    method = method + "  ."
  }
  let endpoint = "http://localhost:7084/mocktail/" + props.data.endpoint
  return (
    <dt key={props.index}>
      <InputGroup
        onClick={!props.disabled ? () => props.onPressAction(props.data) : null}
        className="mb-3"
      >
        <InputGroup.Prepend>
          <InputGroup.Text
            style={{ backgroundColor: bgc, color: "white", fontWeight: "600" }}
            id="basic-addon1"
          >
            {method}
          </InputGroup.Text>
        </InputGroup.Prepend>
        <FormControl
          placeholder={endpoint}
          aria-label={endpoint}
          aria-describedby="basic-addon1"
          disabled
        />
        <InputGroup.Append>
          <Button
            onClick={() => {
              navigator.clipboard.writeText(endpoint)
            }}
            variant="outline-secondary"
          >
            Copy
          </Button>
          {!props.disabled ? (
            <Button
              onClick={
                !props.disabled ? () => props.onPressAction(props.data) : null
              }
              variant="outline-info"
            >
              Details
            </Button>
          ) : null}
        </InputGroup.Append>
      </InputGroup>
    </dt>
  )
}

export default MockItem
