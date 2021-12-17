import React from 'react';
import { Col, Button } from 'react-bootstrap';
import TextInput from '../TextInput';
import MockItem from '../MockItem';
import { testApi } from '../../utils/request';
import PropTypes from 'prop-types';
import { TOASTTYPES } from '../../hooks/useToastify';

function MockApiDetail(props) {
  const { catalog, deleteSelectedApi, frenchToast } = props;
  const { selectedApi } = catalog;
  if (!selectedApi.Method) {
    return <Col style={{ minHeight: '400px' }} />;
  }
  async function testEndpoint() {
    await testApi(selectedApi);
    frenchToast.setToastPropsHandler(TOASTTYPES.INFO, 'See devtools/network tab');
  }

  return (
    <Col>
      <Col>
        <h3 className="h3dr">Request Details</h3>
        <MockItem disabled data={selectedApi}></MockItem>
      </Col>
      <TextInput
        label={'Reponse'}
        disabled
        value={JSON.stringify(selectedApi.Response, null, 2)}></TextInput>
      <Col>
        <Button variant="danger" onClick={() => deleteSelectedApi(selectedApi)}>
          Remove
        </Button>
        <Button style={{ marginLeft: '20px' }} variant="success" onClick={() => testEndpoint()}>
          Test
        </Button>
      </Col>
    </Col>
  );
}

export default MockApiDetail;

MockApiDetail.propTypes = {
  catalog: PropTypes.any,
  frenchToast: PropTypes.any,
  apis: PropTypes.array,
  deleteSelectedApi: PropTypes.func
};
