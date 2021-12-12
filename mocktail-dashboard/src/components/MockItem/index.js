
import React from "react"
import InputGroup from "react-bootstrap/InputGroup"
import FormControl from "react-bootstrap/FormControl"
import Button from "react-bootstrap/Button"
import { API_MOCKTAIL_URL } from '../../utils/paths';
import { RestProfiles } from "../../styles/profiles";

const MockItem = (props) => {
  const { data } = props;
  const { Method } = data;
  console.log("mockitem",props);
  let endpoint = '/' + props.data.Endpoint
  let copyEndpoint = API_MOCKTAIL_URL + props.data.Endpoint
  return (
    <dt key={props.index}>
      <InputGroup className="mb-3">
          <InputGroup.Text
            style={{ backgroundColor: RestProfiles[Method], color: "white", fontWeight: "600" }}
            id="basic-addon1"
          >
            {Method}
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
              onClick={() => props.onPressAction(props.data)
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
