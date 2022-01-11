import React, { useState } from 'react';
import { Row, Tabs, Tab } from 'react-bootstrap';
import Generate from './Generate';
import Catalog from './Catalog';
import Tips from './Tips';
import PropTypes from 'prop-types';
import Import from './Import';
import Settings from './Settings';
import '../../styles/global.css';
export default function DashboadTabs(props) {
  const { refetch, frenchToast } = props;

  const [tip] = useState(Tips[Math.floor(Math.random() * Tips.length)]);

  return (
    <Row className="tabHolder">
      <Tabs defaultActiveKey="generate">
        <Tab eventKey="generate" title="Generate">
          <Generate refetch={refetch} tip={tip} frenchToast={frenchToast} />
        </Tab>
        <Tab eventKey="catalog" title="Catalog">
          <Row>
            <Catalog {...props} />
          </Row>
        </Tab>
        <Tab eventKey="import" title="Import">
          <Import frenchToast={frenchToast} refetch={refetch} />
        </Tab>
        <Tab eventKey="settings" title="Settings">
          <Settings />
        </Tab>
      </Tabs>
    </Row>
  );
}

DashboadTabs.propTypes = {
  refetch: PropTypes.func,
  deleteSelectedApi: PropTypes.func,
  frenchToast: PropTypes.object,
  catalog: PropTypes.object
};
