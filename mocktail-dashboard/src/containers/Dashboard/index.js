import React, { useEffect } from 'react';
import { Container } from 'react-bootstrap';
import DashboadTabs from '../DashboardTabs';
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
    const url = `${DELETE_API}/${selectedApi.Key}`;
    const delResponse = await del(url);
    frenchToast.setToastPropsApiResponseHandler(delResponse);
    await refetch();
  }

  async function refetch() {
    catalog.clearSelectedApi();
    const allApis = await get(ALL_APIS);
    catalog.setApis(allApis);
  }

  return (
    <Container>
      <DashboadTabs
        refetch={refetch}
        frenchToast={frenchToast}
        deleteSelectedApi={deleteSelectedApi}
        catalog={catalog}
      />
    </Container>
  );
}

Dashboad.propTypes = {
  frenchToast: PropTypes.any
};
