import React from "react"
import { Row } from "react-bootstrap"

const Header = (props) => {
  return (
    <div className="myheader">
      <Row>
        <div className="myheadersides"> </div>
        <div className="myheadermiddle">
          <img src="headr1.png" className="headerimg" alt="" />
        </div>
        <div className="myheadersides"> </div>
      </Row>
    </div>
  )
}

export default Header
