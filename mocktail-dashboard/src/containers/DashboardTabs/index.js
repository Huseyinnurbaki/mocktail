import React, { useState } from 'react';
import { Row, Tabs, Tab } from 'react-bootstrap';
import Generate from './Generate';
import Catalog from './Catalog';
import MockApiDetail from '../../components/MockApiDetail';
import Tips from './Tips';
import PropTypes from 'prop-types';
import Import from './Import';

export default function DashboadTabs(props) {
  const { refetch, frenchToast, deleteSelectedApi, catalog } = props;

  const [tip] = useState(Tips[Math.floor(Math.random() * Tips.length)]);

  return (
    <Row style={{ backgroundColor: 'white' }}>
      <Tabs defaultActiveKey="generate">
        <Tab eventKey="generate" title="Generate">
          <Generate refetch={refetch} tip={tip} frenchToast={frenchToast} />
        </Tab>
        <Tab eventKey="catalog" title="Catalog">
          <Row>
            <Catalog catalog={catalog} />
            <MockApiDetail
              catalog={catalog}
              deleteSelectedApi={deleteSelectedApi}
              frenchToast={frenchToast}
            />
          </Row>
        </Tab>
        <Tab eventKey="import" title="Import">
          <Import frenchToast={frenchToast} refetch={refetch} />
        </Tab>
        <Tab disabled eventKey="settings" title="Settings">
          <h3>Coming Soon...</h3>
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
