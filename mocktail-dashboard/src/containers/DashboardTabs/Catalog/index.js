import React from 'react';
import PropTypes from 'prop-types';
import BaseTab from '../../../components/BaseTab';
import MockApiDetail from '../../../components/MockApiDetail';
import CatalogTab from './catalogTab';

function Catalog(props) {
  return (
    <BaseTab>
      <CatalogTab {...props} />
      <MockApiDetail {...props} />
    </BaseTab>
  );
}

export default Catalog;

Catalog.propTypes = {
  tip: PropTypes.string
};
