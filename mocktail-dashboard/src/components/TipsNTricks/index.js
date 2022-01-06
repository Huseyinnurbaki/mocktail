import React from 'react';
import { Col, Card } from 'react-bootstrap';
import { API_MOCKTAIL_URL } from '../../utils/paths.js';
import PropTypes from 'prop-types';

const TipsNTricks = ({ tip }) => {
  return (
    <Col>
      <Col>
        <h3 className="h1dr">Tips & Tricks</h3>
      </Col>
      <Col style={{ marginTop: '18px' }}>
        <Card>
          <Card.Body>{tip}</Card.Body>
        </Card>
      </Col>
      <Col style={{ marginTop: '38px' }}>
        <Card.Title className="h1dr">Sample Request </Card.Title>
        <Card>
          <Card.Body>{API_MOCKTAIL_URL}/your-endpoint</Card.Body>
        </Card>
      </Col>
    </Col>
  );
};

export default TipsNTricks;

TipsNTricks.propTypes = {
  tip: PropTypes.string
};
