import React, { useEffect } from 'react';
import { Container, Row } from 'react-bootstrap';
import DashboadTabs from '../DashboardTabs';
import Catalog from '../../components/Catalog';
import MockApiDetail from '../../components/MockApiDetail';
import useApis from '../../hooks/useApis';
import { ALL_APIS, DELETE_API } from '../../utils/paths';
import { del, get } from '../../utils/request';
import PropTypes from 'prop-types';

export default function Dashboad(props) {
  const { frenchToast } = props;
  const catalog = useApis();

  useEffect(() => {
    async function fetchCatalogApis() {
      const allApis = await get(ALL_APIS);
      catalog.setApis(allApis);
    }
    fetchCatalogApis();
  }, []);

  async function deleteSelectedApi(selectedApi) {
    const url = `${DELETE_API}/${selectedApi.ID}`;
    const delResponse = await del(url);
    frenchToast.setToastProps(delResponse);
    await refetch();
  }

  async function refetch() {
    catalog.clearSelectedApi();
    const allApis = await get(ALL_APIS);
    catalog.setApis(allApis);
  }

  return (
    <Container>
      <DashboadTabs refetch={refetch} frenchToast={frenchToast} />
      <Row>
        <Catalog catalog={catalog} />
        <MockApiDetail
          catalog={catalog}
          deleteSelectedApi={deleteSelectedApi}
          frenchToast={frenchToast}
        />
      </Row>
    </Container>
  );
}

Dashboad.propTypes = {
  frenchToast: PropTypes.any
};
