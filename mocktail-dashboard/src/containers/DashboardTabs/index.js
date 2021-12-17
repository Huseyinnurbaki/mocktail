import React, { useState } from 'react';
import { Row, Tabs, Tab } from 'react-bootstrap';
import Generate from './Generate';
import Export from './Export';
import Tips from './Tips';
import PropTypes from 'prop-types';

export default function DashboadTabs(props) {
  const { refetch, frenchToast } = props;

  const [tip] = useState(Tips[Math.floor(Math.random() * Tips.length)]);

  return (
    <Row style={{ backgroundColor: 'white' }}>
      <Tabs defaultActiveKey="generate">
        <Tab eventKey="generate" title="Generate">
          <Generate refetch={refetch} tip={tip} frenchToast={frenchToast} />
        </Tab>
        <Tab disabled eventKey="validator" title="Validator">
          <h3>Coming Soon...</h3>
        </Tab>
        <Tab eventKey="export" title="Export">
          <Export />
        </Tab>
        <Tab disabled eventKey="import" title="Import">
          <h3>Coming Soon...</h3>
        </Tab>
        <Tab disabled eventKey="cascade" title="Cascade">
          <h3>Coming Soon...</h3>
        </Tab>
      </Tabs>
    </Row>
  );
}

DashboadTabs.propTypes = {
  refetch: PropTypes.func,
  frenchToast: PropTypes.func
};
