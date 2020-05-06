import React from "react"
import { Col, Button, Row } from "react-bootstrap"
import BigTextInput from "../BigTextInput"
import MockItem from "../MockItem"

const MockItemDetail = (props) => {
  if (!props.data.method) {
    return (
      <Col style={{ minHeight: "400px" }}>
        <h1 className="h1dr">Choose Template From Left</h1>
        <img
          style={{ height: "100px", marginTop: "60px", opacity: "0.5" }}
          src="left.png"
          className="rounded mr-2"
          alt=""
        />
      </Col>
    )
  }
  let method = props.data.method.toString().toUpperCase()
  let borders = {}
  if (props.apiCheck && props.apiCheck.data) {
    borders = {
      borderColor: props.apiCheck.data.status === "success" ? "#4BB543" : "red",
      borderWidth: 1.5,
    }
  }

  return (
    <div>
      <Col>
        <h1 className="h1dr">Request Details</h1>
        <MockItem disabled={props.disabled} data={props.data}></MockItem>
      </Col>
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
      <Col>
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
      </Col>
      <Row>
        {borders.borderColor ? (
          <h6 className={"smallDetail"} style={{ color: borders.borderColor }}>
            {borders.borderColor === "red"
              ? "Please try deleting and re-adding your request template."
              : "Success"}
          </h6>
        ) : null}
      </Row>
    </div>
  )
}

export default MockItemDetail
