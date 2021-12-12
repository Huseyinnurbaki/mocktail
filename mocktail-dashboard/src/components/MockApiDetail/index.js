import React from 'react';
import { Col, Button } from 'react-bootstrap';
import TextInput from '../TextInput';
import MockItem from '../MockItem';
import { testApi } from '../../utils/request';
import PropTypes from 'prop-types';

function MockApiDetail(props) {
  const { catalog, deleteSelectedApi, frenchToast } = props;
  const { selectedApi } = catalog;
  if (!selectedApi.Method) {
    return (
      <Col style={{ minHeight: '400px' }}>
        <h3 className="h3dr">Choose Template From Left</h3>
        <img
          style={{ height: '100px', marginTop: '60px', opacity: '0.5' }}
          src="left.png"
          className="rounded mr-2"
          alt=""
        />
      </Col>
    );
  }
  async function testEndpoint() {
    const resp = await testApi(selectedApi);
    frenchToast.setToastPropsHandler(resp);
  }

  let method = selectedApi.Method;
  return (
    <Col>
      <Col>
        <h3 className="h3dr">Request Details</h3>
        <MockItem disabled data={selectedApi}></MockItem>
      </Col>
      {method === 'POST' ? (
        <TextInput
          label={'Request'}
          disabled
          value={JSON.stringify(selectedApi.RequestParams, null, 2)}></TextInput>
      ) : null}
      <TextInput
        label={'Reponse'}
        disabled
        value={JSON.stringify(selectedApi.Response, null, 2)}></TextInput>
      <Col>
        <Button variant="danger" onClick={() => deleteSelectedApi(selectedApi)}>
          Delete
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
