import React from 'react';
import PropTypes from 'prop-types';
import { Grid, GridItem } from '@chakra-ui/react';
import MockApiDetail from '../../../components/MockApiDetail';
import CatalogTab from './catalogTab';

function Catalog(props) {
  return (
    <Grid templateColumns="1fr 1fr" gap={6}>
      <GridItem>
        <CatalogTab {...props} />
      </GridItem>
      <GridItem>
        <MockApiDetail {...props} />
      </GridItem>
    </Grid>
  );
}

export default Catalog;

Catalog.propTypes = {
  catalog: PropTypes.object,
  deleteSelectedApi: PropTypes.func,
  refetch: PropTypes.func
};
