import React from 'react';
import { Card, Tabs } from '@chakra-ui/react';
import Generate from './Generate';
import Catalog from './Catalog';
import PropTypes from 'prop-types';

export default function DashboadTabs(props) {
  const { refetch } = props;

  return (
    <Card.Root bg="white" shadow="md" borderRadius="lg" overflow="hidden">
      <Tabs.Root defaultValue="generate" variant="line">
        <Tabs.List
          borderBottom="1px solid"
          borderColor="gray.200"
          bg="gray.50"
        >
          <Tabs.Trigger value="generate" fontWeight="medium" py={3} px={6}>
            Create
          </Tabs.Trigger>
          <Tabs.Trigger value="catalog" fontWeight="medium" py={3} px={6}>
            Catalog
          </Tabs.Trigger>
        </Tabs.List>
        <Card.Body p={6}>
          <Tabs.Content value="generate">
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
