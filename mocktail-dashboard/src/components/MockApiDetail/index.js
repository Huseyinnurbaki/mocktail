import React from "react"
import { Col, Button, Row } from "react-bootstrap"
import TextInput from "../TextInput"
import MockItem from "../MockItem"
import { testApi } from "../../utils/request"

function MockApiDetail(props) {
  const { catalog, deleteSelectedApi } = props;
  const { selectedApi } = catalog;
  console.log("seses",selectedApi);
  if (!selectedApi.Method) {
    return (
      <Col style={{ minHeight: "400px" }}>
        <h3 className="h3dr">Choose Template From Left</h3>
        <img
          style={{ height: "100px", marginTop: "60px", opacity: "0.5" }}
          src="left.png"
          className="rounded mr-2"
          alt=""
        />
      </Col>
    )
  }
  async function testEndpoint() {
    await testApi(selectedApi)
  }
  let method = selectedApi.Method
  let borders = {}
  if (props.apiCheck && props.apiCheck.data) {
    borders = {
      borderColor: props.apiCheck.data.status === "success" ? "#4BB543" : "red",
      borderWidth: 1.5,
    }
  }

  return (
    <Col>
      <Col>
        <h3 className="h3dr">Request Details</h3>
        <MockItem disabled={props.disabled} data={selectedApi}></MockItem>
      </Col>
      {method === "POST" ? (
        <TextInput
          style={borders}
          label={"Request"}
          disabled
          value={JSON.stringify(selectedApi.RequestParams, null, 2)}
        ></TextInput>
      ) : null}
      <TextInput
        style={borders}
        label={"Reponse"}
        disabled
        value={JSON.stringify(selectedApi.Response, null, 2)}
      ></TextInput>
      <Col>
        <Button variant="danger" onClick={() => deleteSelectedApi(selectedApi)}>
          Delete
        </Button>
        <Button
          style={{ marginLeft: "20px" }}
          variant="success"
          onClick={() => testEndpoint()}
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
    </Col>
  )
}

export default MockApiDetail
