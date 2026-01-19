import React, { useState } from 'react';
import { Card, Tabs } from '@chakra-ui/react';
import Generate from './Generate';
import Catalog from './Catalog';
import PropTypes from 'prop-types';

export default function DashboadTabs(props) {
  const { refetch } = props;

  // Read initial tab from URL query parameter
  const getInitialTab = () => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    return tab === 'catalog' ? 'catalog' : 'create';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  // Update URL when tab changes
  const handleTabChange = (details) => {
    const newTab = details.value;
    setActiveTab(newTab);

    const url = new URL(window.location);
    url.searchParams.set('tab', newTab);
    window.history.pushState({}, '', url);
  };

  return (
    <Card.Root bg="white" shadow="md" borderRadius="lg" overflow="hidden">
      <Tabs.Root value={activeTab} onValueChange={handleTabChange} variant="line">
        <Tabs.List
          borderBottom="1px solid"
          borderColor="gray.200"
          bg="gray.50"
        >
          <Tabs.Trigger value="create" fontWeight="medium" py={3} px={6}>
            Create
          </Tabs.Trigger>
          <Tabs.Trigger value="catalog" fontWeight="medium" py={3} px={6}>
            Catalog
          </Tabs.Trigger>
        </Tabs.List>
        <Card.Body p={6}>
          <Tabs.Content value="create">
            <Generate refetch={refetch} />
          </Tabs.Content>
          <Tabs.Content value="catalog">
            <Catalog {...props} />
          </Tabs.Content>
        </Card.Body>
      </Tabs.Root>
    </Card.Root>
  );
}

DashboadTabs.propTypes = {
  refetch: PropTypes.func,
  deleteSelectedApi: PropTypes.func,
  catalog: PropTypes.object
};
