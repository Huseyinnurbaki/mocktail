import React from "react"
import ListGroup from "react-bootstrap/ListGroup"
import { Col } from "react-bootstrap"

const TipsNTricks = (props) => {
  return (
    <Col>
      <h1>Tips</h1>
      <ListGroup>
        <h5>Enter the endpoint you wish to call to the left..</h5>
        <h5>Enter the response you wish to obtain to the left.</h5>
        <h5>Maximum request size is 40mb.</h5>
        <h5>You can delete all apis from cascade tab.</h5>
        <h5>
          Click on one request template under search bar. You willsee the details on
          the bottom right.{" "}
        </h5>
      </ListGroup>
    </Col>
    // <ol>
    //
    // <h1>Tips</h1>
    //     <li>Enter the response you wish to obtain to the left.</li>
    //     <li>Enter the endpoint you wish to call .</li>
    //     <li>Maximum srequest size is 40mb.</li>

    // </ol>
  )
}

export default TipsNTricks
