/* eslint-disable react/jsx-filename-extension */
import React, { useState, useRef } from 'react';
import { Col, Button, Row } from 'react-bootstrap';
import PrefixedInput from '../../../components/PrefixedInput';
import TextInput from '../../../components/TextInput';
import { SAVE_API } from '../../../utils/paths';
import { post } from '../../../utils/request';
import PropTypes from 'prop-types';

const Post = function (props) {
  const { refetch, frenchToast } = props;
  const formRef = useRef(null);
  const [endpointValue, setEndpointValue] = useState('');
  const [responseValue, setResponseValueValue] = useState();

  function clearAll() {
    formRef.current.reset();
    setEndpointValue('');
    setResponseValueValue();
  }

  async function save() {
    const body = {
      Endpoint: endpointValue,
      Method: 'POST',
      Response: JSON.parse(responseValue)
    };

    const res = await post(SAVE_API, body);
    frenchToast.setToastProps(res);

    await refetch();
  }

  return (
    <Col style={{ backgroundColor: 'white' }}>
      <Col style={{ backgroundColor: 'white' }}>
        <h3 className="h1dr">Post Request Template</h3>
      </Col>

      <Col style={{ minHeight: '100px', paddingBottom: '12px' }}>
        <PrefixedInput value={endpointValue} onChange={(e) => setEndpointValue(e.target.value)} />
        <Row>
          <TextInput
            label="Response Body"
            value={responseValue}
            onChange={(e) => setResponseValueValue(e.target.value)}
          />
          <TextInput
            label="Response Body"
            value={responseValue}
            onChange={(e) => setResponseValueValue(e.target.value)}
          />
        </Row>
      </Col>

      <Col>
        <Button disabled={false} onClick={() => save()}>
          Save
        </Button>
        <Button
          disabled={false}
          style={{ marginLeft: '20px' }}
          variant="warning"
          onClick={() => clearAll()}>
          Clear
        </Button>
      </Col>
    </Col>
  );
};

export default Post;

Post.propTypes = {
  refetch: PropTypes.func,
  frenchToast: PropTypes.func
};
