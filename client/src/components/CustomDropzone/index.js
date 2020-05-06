import React, { useCallback } from "react"
import { useDropzone } from "react-dropzone"
import Col from "react-bootstrap/cjs/Col"

export default function CustomDropzone(props) {
  const onDrop = useCallback((acceptedFiles) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader()

      reader.onabort = () => console.log("file reading was aborted")
      reader.onerror = () => console.log("file reading has failed")
      reader.onload = () => {
        // Do whatever you want with the file contents
        const convertedToJson = reader.result
        // bu gelen data string
        props.upload(convertedToJson)

        //   console.log("-------", JSON.parse(convertedToJson))
        // data.append("file", binaryStr)
      }
      // reader.readAsArrayBuffer(file)
      reader.readAsText(file)
    })
  }, [])
  const { getRootProps, getInputProps } = useDropzone({ onDrop })

  return (
    <Col className="dropzoneWrapper" {...getRootProps()}>
      <input {...getInputProps()} />
      <img
        style={{
          height: "250px",
          marginTop: "80px",
          alignSelf: "center",
          opacity: "0.85",
        }}
        src="up.png"
        className="headerimg"
        alt=""
      ></img>
      <h3 className='h2dr' style={{ textAlign: 'center',paddingTop: '5px'}} >Drop or Click Here</h3>
    </Col>
  )
}
