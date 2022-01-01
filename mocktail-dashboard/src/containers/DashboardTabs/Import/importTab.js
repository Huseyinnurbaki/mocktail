import React from 'react';
import { Row } from 'react-bootstrap';
import PropTypes from 'prop-types';
import CoolDropzone from '../../../components/Dropzone';
import { post } from '../../../utils/request';
import { IMPORT_API } from '../../../utils/paths';

function ImportTab(props) {
  const { frenchToast, refetch } = props;
  async function upload(list) {
    const res = await post(IMPORT_API, list);
    frenchToast.setToastPropsApiResponseHandler(res);
    await refetch();
  }

  return (
    <Row>
      <h2>Import</h2>
      <CoolDropzone frenchToast={frenchToast} upload={(list) => upload(list)} />
    </Row>
  );
}

export default ImportTab;

ImportTab.propTypes = {
  frenchToast: PropTypes.any,
  refetch: PropTypes.any
};
