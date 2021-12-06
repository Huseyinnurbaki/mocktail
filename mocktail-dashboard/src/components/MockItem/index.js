
import React from "react"
import InputGroup from "react-bootstrap/InputGroup"
import FormControl from "react-bootstrap/FormControl"
import Button from "react-bootstrap/Button"

const MockItem = (props) => {
  console.log("mockitem",props);
  let method = props.data.Method;
  let bgc = "orange"
  if (method === "GET") {
    bgc = "#17b027"
    method = method + "  ."
  }
  let endpoint = '/' + props.data.Endpoint
  let copyEndpoint = "http://localhost:7080/mocktail/" + props.data.Endpoint
  return (
    <dt key={props.index}>
      <InputGroup className="mb-3">
          <InputGroup.Text
            style={{ backgroundColor: bgc, color: "white", fontWeight: "600" }}
            id="basic-addon1"
          >
            {method}
          </InputGroup.Text>
        <FormControl
          placeholder={endpoint}
          aria-label={endpoint}
          aria-describedby="basic-addon1"
          disabled
        />
          <Button
            onClick={() => {
              navigator.clipboard.writeText(copyEndpoint)
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
      </InputGroup>
    </dt>
  )
}

export default MockItem
