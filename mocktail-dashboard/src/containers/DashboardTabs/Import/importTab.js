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
      <h3>Import ⬆️</h3>
      <h6>
        Use this tab to import files exported from Catalog Tab. Any json file matching the format is
        accepted.
      </h6>
      <CoolDropzone frenchToast={frenchToast} upload={(list) => upload(list)} />
    </Row>
  );
}

export default ImportTab;

ImportTab.propTypes = {
  frenchToast: PropTypes.any,
  refetch: PropTypes.any
};
