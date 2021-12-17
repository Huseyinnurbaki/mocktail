import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Col from 'react-bootstrap/cjs/Col';
import PropTypes from 'prop-types';
import { TOASTTYPES } from '../../hooks/useToastify';

export default function CoolDropzone(props) {
  const { upload, frenchToast } = props;
  const onDrop = useCallback((acceptedFiles) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader();

      reader.onabort = () =>
        frenchToast.setToastPropsHandler(TOASTTYPES.INFO, 'file reading was aborted');
      reader.onerror = () =>
        frenchToast.setToastPropsHandler(TOASTTYPES.INFO, 'file reading has failed');
      reader.onload = () => {
        const convertedToJson = reader.result;
        try {
          JSON.parse(convertedToJson);
          upload(convertedToJson);
        } catch (error) {
          frenchToast.setToastPropsHandler(TOASTTYPES.ERROR, 'Json File is not parsable');
        }
      };
      reader.readAsText(file);
    });
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <Col style={{ textAlign: 'center' }} className="dropzoneWrapper" {...getRootProps()}>
      <input {...getInputProps()} />
      <img
        style={{
          height: '250px',
          marginTop: '80px',
          alignSelf: 'center',
          opacity: '0.85'
        }}
        src="up.png"
        className="headerimg"
        alt="upload"
      />
      {isDragActive ? (
        <h5 style={{ textAlign: 'center', paddingTop: '5px' }}>Drop the files here ...</h5>
      ) : (
        <h5 style={{ textAlign: 'center', paddingTop: '5px' }}>Drop or Click Here</h5>
      )}
    </Col>
  );
}

CoolDropzone.propTypes = {
  upload: PropTypes.func,
  frenchToast: PropTypes.any
};
