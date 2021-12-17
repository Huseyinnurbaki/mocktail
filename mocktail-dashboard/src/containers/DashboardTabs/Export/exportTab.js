import React from 'react';
import { Col, Button, Row } from 'react-bootstrap';
import { EXPORT_API } from '../../../utils/paths';
import PropTypes from 'prop-types';
import { get } from '../../../utils/request';

function ExportTab() {
  async function exportApis() {
    const res = await get(EXPORT_API);
    const json = JSON.stringify(res);
    const blob = new Blob([json], { type: 'application/json' });
    const href = await URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = 'mocktail.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <Row>
      <Col>
        <h2>Export </h2>
        <h5>Export all mock apis into a json file. </h5>
        <Button onClick={() => exportApis()}>Download</Button>
      </Col>
      <Col>
        <img
          src="do.png"
          style={{ height: '250px', marginTop: '80px', opacity: '0.85' }}
          className="headerimg"
          alt=""
        />
      </Col>
    </Row>
  );
}

export default ExportTab;

ExportTab.propTypes = {
  frenchToast: PropTypes.any,
  refetch: PropTypes.func
};
