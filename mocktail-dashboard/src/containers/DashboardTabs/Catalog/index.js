import React, { useState, useEffect } from 'react';
import { Col, FormControl, Button, InputGroup } from 'react-bootstrap';

import MockItem from '../../../components/MockItem';
import PropTypes from 'prop-types';

export default function Catalog(props) {
  const { catalog } = props;
  const { apis, setSelectedApi } = catalog;
  const [displayedApis, setApis] = useState(apis);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setApis(apis);
  }, [apis]);

  useEffect(() => {
    const results =
      apis && apis?.filter((val) => val.Endpoint.toLowerCase().includes(searchTerm.toLowerCase()));
    setApis(results);
  }, [apis, searchTerm]);

  const searchHandler = (event) => {
    setSearchTerm(event.target.value);
  };

  async function exportApis() {
    const json = JSON.stringify(displayedApis);
    const blob = new Blob([json], { type: 'application/json' });
    const href = await URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = 'mocktail.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <Col>
      <h3>🍹Apis</h3>
      <InputGroup className="mb-3">
        <FormControl
          type="text"
          placeholder="Search endpoint.."
          className="mr-sm-2"
          onChange={searchHandler}
        />
        <Button onClick={exportApis} variant="outline-secondary">
          Export {displayedApis.length} ⬇️
        </Button>
      </InputGroup>
      <div className="scroller">
        {displayedApis.length ? (
          displayedApis.map((item, index) => (
            <MockItem data={item} key={index} onPressAction={() => setSelectedApi(item)} />
          ))
        ) : (
          <h6 className="header">ℹ️ Use Generate tab to create a new api.</h6>
        )}
      </div>
    </Col>
  );
}

Catalog.propTypes = {
  catalog: PropTypes.any,
  apis: PropTypes.array,
  setSelectedApi: PropTypes.func
};
