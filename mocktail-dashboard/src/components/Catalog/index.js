import React, { useState, useEffect } from "react"
import ListGroup from "react-bootstrap/ListGroup"
import Form from "react-bootstrap/Form"
import FormControl from "react-bootstrap/FormControl"
import MockItem from "../MockItem"
import _ from "lodash"
import Col from "react-bootstrap/cjs/Col"

export default function Catalog(props) {
  const { catalog } = props
  const { apis, setSelectedApi } = catalog
  const [displayedApis, setApis] = useState(apis)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    setApis(apis)
  }, [apis])

  const searchHandler = (event) => {
    setSearchTerm(event.target.value)
  }


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
          {displayedApis.length ? (
            displayedApis.map((item, index) => (
              <MockItem
                data={item}
                key={index}
                onPressAction={() => setSelectedApi(item)}
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
