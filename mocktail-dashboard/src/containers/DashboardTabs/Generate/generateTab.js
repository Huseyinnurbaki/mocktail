import React, { useState, useRef } from 'react';
import { Col, Button, Form } from 'react-bootstrap';
import PrefixedInput from '../../../components/PrefixedInput';
import TextInput from '../../../components/TextInput';
import { SAVE_API } from '../../../utils/paths';
import { post } from '../../../utils/request';
import PropTypes from 'prop-types';
import { TOASTTYPES } from '../../../hooks/useToastify';

const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE'
};
function GenerateTab(props) {
  const { refetch, frenchToast } = props;
  const formRef = useRef(null);
  const [endpointValue, setEndpointValue] = useState('');
  const [responseValue, setResponseValueValue] = useState('');
  const [selectedMethod, setSelectedMethod] = useState(HTTP_METHODS.GET);

  function clearAll() {
    setEndpointValue('');
    setResponseValueValue('');
  }

  async function proceed() {
    try {
      if (typeof JSON.parse(responseValue) !== 'object') throw 'Unparsable Json';
      save();
    } catch (error) {
      frenchToast.setToastPropsHandler(TOASTTYPES.ERROR, error.message || error);
    }
  }

  async function save() {
    const body = {
      Endpoint: endpointValue,
      Method: selectedMethod,
      Response: JSON.parse(responseValue)
    };

    const res = await post(SAVE_API, body);
    frenchToast.setToastPropsApiResponseHandler(res);
    clearAll();

    await refetch();
  }

  return (
    <>
      <h3>Request Template ➕</h3>
      <Col style={{ minHeight: '100px', paddingBottom: '12px' }}>
        <Form ref={formRef}>
          <PrefixedInput
            value={endpointValue}
            onChange={(e) => setEndpointValue(e.target.value.replace(/\s/g, ''))}
            selectedMethod={selectedMethod}
            setSelectedMethod={setSelectedMethod}
            HTTP_METHODS={HTTP_METHODS}
            isInvalid={!endpointValue}
            required
          />
          <TextInput
            label="Response Body"
            value={responseValue}
            onChange={(e) => setResponseValueValue(e.target.value)}
          />
        </Form>
        <Col style={{ marginTop: '12px' }}>
          <Button type="submit" onClick={proceed}>
            Save 👍
          </Button>
          <Button
            disabled={false}
            style={{ marginLeft: '20px' }}
            variant="warning"
            onClick={() => clearAll()}>
            Clear 🧹
          </Button>
        </Col>
      </Col>
    </>
  );
}

export default GenerateTab;

GenerateTab.propTypes = {
  frenchToast: PropTypes.any,
  refetch: PropTypes.func
};
