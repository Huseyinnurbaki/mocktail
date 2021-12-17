import React from 'react';
import { Row } from 'react-bootstrap';
import PropTypes from 'prop-types';
import CoolDropzone from '../../../components/Dropzone';

function ImportTab(props) {
  const { frenchToast } = props;
  async function upload() {
    console.log('upload');
  }

  return (
    <Row>
      <h2>Import </h2>
      <CoolDropzone frenchToast={frenchToast} upload={() => upload()} />
    </Row>
  );
}

export default ImportTab;

ImportTab.propTypes = {
  frenchToast: PropTypes.any
};
