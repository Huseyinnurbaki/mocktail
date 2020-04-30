import React from "react"
import { Col, Button, Row } from "react-bootstrap"
import BigTextInput from "../BigTextInput"
import MockItem from "../MockItem"

const MockItemDetail = (props) => {
  if (!props.data.method) {
    return <h3 className="header">Choose a template from left</h3>
  }
  let method = props.data.method.toString().toUpperCase()
  let borders = {}
  if (props.apiCheck && props.apiCheck.data) {
    borders = {
      borderColor: props.apiCheck.data.status === "success" ? "#4BB543" : "red",
      borderWidth: 1.5,
    }
  }
  // console.log("mockitemdetail -->", JSON.stringify(props.data.request, null, 2));

  return (
    <Col>
      <MockItem disabled={props.disabled} data={props.data}></MockItem>
      {method === "POST" ? (
        <BigTextInput
          style={borders}
          label={"Request"}
          disabled
          value={JSON.stringify(props.data.request, null, 2)}
        ></BigTextInput>
      ) : null}
      <BigTextInput
        style={borders}
        label={"Reponse"}
        disabled
        value={JSON.stringify(props.data.response, null, 2)}
      ></BigTextInput>
      <Button variant="danger" onClick={props.deleteSelectedRequest}>
        Delete
      </Button>
      <Button
        style={{ marginLeft: "20px" }}
        variant="success"
        onClick={props.testItem}
      >
        Test
      </Button>
      <Row>
        {borders.borderColor ? (
          <h7 className={"smallDetail"} style={{ color: borders.borderColor }}>
            {borders.borderColor === "red"
              ? "Please try deleting and re-adding your request template."
              : "Success"}
          </h7>
        ) : null}
      </Row>
    </Col>
  )
}

export default MockItemDetail
