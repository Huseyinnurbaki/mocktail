import React from 'react';
import { Row, Col, Container } from 'react-bootstrap';

const Header = () => {
  return (
    <Container>
      <Row className="justify-content-md-center">
        <Col xs={12} sm={4} md={4}>
          <img
            src="./header.webp"
            className="headerimg"
            alt=""
            style={{ height: '100px', alignSelf: 'center' }}
          />
        </Col>
      </Row>
    </Container>
  );
};

export default Header;
