import React, { useState } from 'react';
import { Row, Tabs, Tab } from 'react-bootstrap';
import GetTab from './GetTab';
import PostTab from './PostTab';
import Tips from './Tips';
import PropTypes from 'prop-types';

export default function DashboadTabs(props) {
  const { refetch, frenchToast } = props;

  const [tip] = useState(Tips[Math.floor(Math.random() * Tips.length)]);

  return (
    <Row style={{ backgroundColor: 'yellow' }}>
      <Tabs defaultActiveKey="get">
        <Tab eventKey="get" title="Get">
          <GetTab refetch={refetch} tip={tip} frenchToast={frenchToast} />
        </Tab>
        <Tab eventKey="post" title="Post">
          <PostTab refetch={refetch} tip={tip} frenchToast={frenchToast} />
        </Tab>
        <Tab eventKey="export" title="Export">
          <h3>fev</h3>
        </Tab>
        <Tab eventKey="import" title="Import">
          <h3>fev</h3>
        </Tab>
        <Tab eventKey="validator" title="Validator">
          <h3>fev</h3>
        </Tab>
      </Tabs>
    </Row>
  );
}

DashboadTabs.propTypes = {
  refetch: PropTypes.func,
  frenchToast: PropTypes.func
};
