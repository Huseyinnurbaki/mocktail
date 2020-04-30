import React from "react"
import { Toast } from "react-bootstrap"

const CustomToast = (props) => {
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
            borderColor: props.toastBody.includes("!") ? "red" : "#4BB543",
          }}
          onClose={() => props.onToastClose(false)}
          show={props.showToast}
          delay={props.delay || 5000}
          autohide={props.autohide || true}
        >
          <Toast.Header
            style={{
              color: props.toastBody.includes("!") ? "red" : "#4BB543",
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
