import React, { useState, useEffect } from "react"
import ListGroup from "react-bootstrap/ListGroup"
import Form from "react-bootstrap/Form"
import FormControl from "react-bootstrap/FormControl"
import MockItem from "../MockItem"
import _ from "lodash"
import Col from "react-bootstrap/cjs/Col"

export default function MockList(props) {
  const [displayedApis, setApis] = useState(props.apis.data)
  const [searchTerm, setSearchTerm] = useState("")

  const searchHandler = (event) => {
    setSearchTerm(event.target.value)
  }
  useEffect(() => {
    setApis(props.apis.data)
  }, [props.apis.data])
  useEffect(() => {
    const results = props.apis.data
      ? props.apis.data.filter((val) =>
          val.endpoint.toLowerCase().includes(searchTerm)
        )
      : undefined
    setApis(results)
  }, [searchTerm])

  return (
    <Col>
      <ListGroup>
        <Form inline style={{ marginTop: "10px", marginBottom: "20px" }}>
          <FormControl
            disabled={!displayedApis}
            type="text"
            placeholder="Type only the endpoint.."
            className="mr-sm-2"
            onChange={searchHandler}
          />
        </Form>
        <div className="scroller">
          {!_.isEmpty(displayedApis) ? (
            displayedApis.map((item, index) => (
              <MockItem
                data={item}
                key={index}
                onPressAction={props.onPressAction}
              ></MockItem>
            ))
          ) : (
            <h3 className="header">There is no endpoint..</h3>
          )}
        </div>
      </ListGroup>
    </Col>
  )
}
