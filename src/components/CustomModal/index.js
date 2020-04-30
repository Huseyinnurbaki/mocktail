import React from "react"
import { Modal, Button } from "react-bootstrap"

const CustomModal = (props) => {
  return (
    <Modal
      {...props}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      centered
      onHide={props.onHide}
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">
          {props.vals.type}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <h4>{props.vals.header}</h4>
        <p> {props.vals.desc} </p>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={props.onHide}>Cancel</Button>
        <Button variant="danger" onClick={props[props.vals.secondary]}>
          {props.vals.header}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default CustomModal
