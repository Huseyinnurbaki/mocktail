import React, { useEffect } from 'react';
import { Container } from '@chakra-ui/react';
import DashboadTabs from '../DashboardTabs';
import useApis from '../../hooks/useApis';
import { ALL_APIS, DELETE_API } from '../../utils/paths';
import { del, get } from '../../utils/request';
import { showToast, TOASTTYPES } from '../../utils/toast';

export default function Dashboad() {
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
    if (delResponse?.status === 200) {
      showToast(TOASTTYPES.SUCCESS, 'Endpoint deleted successfully');
    } else {
      showToast(TOASTTYPES.ERROR, delResponse?.message || 'Failed to delete endpoint');
    }
    await refetch();
  }

  async function refetch() {
    catalog.clearSelectedApi();
    const allApis = await get(ALL_APIS);
    catalog.setApis(allApis);
  }

  return (
    <Container maxW="container.xl" py={8} px={{ base: 4, md: 6 }}>
      <DashboadTabs
        refetch={refetch}
        deleteSelectedApi={deleteSelectedApi}
        catalog={catalog}
      />
    </Container>
  );
}
