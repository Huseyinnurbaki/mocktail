import React from "react"
import { Toast } from "react-bootstrap"
import _ from "lodash"

const CustomToast = (props) => {
  let statusColor = "#4BB543"
  if (_.isEmpty(props.toastBody)) {
    statusColor = undefined
  } else if (props.toastBody && props.toastBody.includes("!")) {
    statusColor = "red"
  }
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      style={{ position: "relative", minHeight: "65px", zIndex: 9 }}
    >
      <div style={{ position: "absolute", top: 0, right: 0 }}>
        <Toast
          style={{
            minHeight: "100px",
            minWidth: "300px",
            borderWidth: "1px",
            borderRadius: "4px",
            borderColor: statusColor,
            position: 'fixed',
            top: 0,
            right: 0,
          }}
          onClose={() => props.onToastClose(false)}
          show={props.showToast}
          delay={props.delay || 3500}
          autohide={props.autohide || true}
        >
          <Toast.Header
            style={{
              color: statusColor,
            }}
          >
            <img src="mocktail.ico" className="rounded mr-2" alt="" />
            <strong className="mr-auto">Mocktail</strong>
            <small>just now</small>
          </Toast.Header>
          <Toast.Body>{props.toastBody}</Toast.Body>
        </Toast>
      </div>
    </div>
  )
}

export default CustomToast
