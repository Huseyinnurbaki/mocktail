import React, { useState, useEffect, useRef } from 'react';
import { Box, Input, Button, Group, VStack, Text, HStack } from '@chakra-ui/react';

import MockItem from '../../../components/MockItem';
import PropTypes from 'prop-types';
import { post } from '../../../utils/request';
import { IMPORT_API } from '../../../utils/paths';
import { showToast, TOASTTYPES } from '../../../utils/toast';

const ITEMS_PER_PAGE = 8;

export default function CatalogTab(props) {
  const { catalog, refetch } = props;
  const { apis, setSelectedApi, selectedApi } = catalog;
  const [displayedApis, setApis] = useState(apis);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setApis(apis);
    setCurrentPage(1);
    // Select first API by default if none selected
    if (apis && apis.length > 0 && !selectedApi.Method) {
      setSelectedApi(apis[0]);
    }
  }, [apis, selectedApi.Method, setSelectedApi]);

  useEffect(() => {
    const results =
      apis && apis?.filter((val) => val.Endpoint.toLowerCase().includes(searchTerm.toLowerCase()));
    setApis(results);
    setCurrentPage(1);
  }, [apis, searchTerm]);

  const searchHandler = (event) => {
    setSearchTerm(event.target.value);
  };

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(displayedApis.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedApis = displayedApis.slice(startIndex, endIndex);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
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

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onabort = () => showToast(TOASTTYPES.INFO, 'File reading was aborted');
    reader.onerror = () => showToast(TOASTTYPES.ERROR, 'File reading failed');
    reader.onload = async () => {
      try {
        const body = { Apis: JSON.parse(reader.result) };
        const res = await post(IMPORT_API, body);
        if (res?.status === 200) {
          const { imported, skipped, failed } = res;
          const message = `Import complete: ${imported} imported, ${skipped} skipped, ${failed} failed`;
          showToast(TOASTTYPES.SUCCESS, message);
        } else {
          showToast(TOASTTYPES.ERROR, res?.message || 'Import failed');
        }
        await refetch();
      } catch (error) {
        showToast(TOASTTYPES.ERROR, 'Invalid JSON file');
      }
    };
    reader.readAsText(file);

    // Reset input so same file can be selected again
    event.target.value = '';
  };

  return (
    <VStack align="stretch" gap={4}>
      <HStack justify="space-between" align="center">
        <Text fontSize="lg" fontWeight="semibold">
          Mock Endpoints ({displayedApis.length})
        </Text>
        <HStack gap={2}>
          <Button onClick={handleImportClick} variant="outline" size="sm" colorPalette="gray">
            Import
          </Button>
          <Button onClick={exportApis} variant="outline" size="sm" colorPalette="gray">
            Export
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </HStack>
      </HStack>

      <Group attached>
        <Input
          type="text"
          placeholder="Search endpoints..."
          onChange={searchHandler}
          value={searchTerm}
          fontSize="sm"
        />
      </Group>

      <Box flex="1" overflowY="auto" minH="405px">
        <VStack align="stretch" gap={3}>
          {displayedApis.length ? (
            paginatedApis.map((item, index) => (
              <MockItem
                data={item}
                key={index}
                selected={selectedApi.ID === item.ID}
                onPressAction={() => setSelectedApi(item)}
              />
            ))
          ) : (
            <Box
              p={6}
              textAlign="center"
              bg="gray.50"
              borderRadius="md"
              border="1px solid"
              borderColor="gray.200"
            >
              <Text color="gray.600" fontSize="sm">
                No endpoints found. Use the Create tab to add your first mock endpoint.
              </Text>
            </Box>
          )}
        </VStack>
      </Box>

      <HStack justify="space-between" align="center" pt={4} borderTop="1px solid" borderColor="gray.200">
        <Button
          onClick={goToPrevPage}
          disabled={currentPage === 1 || displayedApis.length === 0}
          size="sm"
          variant="outline"
          colorPalette="gray"
        >
          Previous
        </Button>
        <Text fontSize="sm" color="gray.600">
          Page {currentPage} of {totalPages}
        </Text>
        <Button
          onClick={goToNextPage}
          disabled={currentPage === totalPages || displayedApis.length === 0}
          size="sm"
          variant="outline"
          colorPalette="gray"
        >
          Next
        </Button>
      </HStack>
    </VStack>
  );
}

CatalogTab.propTypes = {
  catalog: PropTypes.shape({
    apis: PropTypes.array,
    selectedApi: PropTypes.object,
    setSelectedApi: PropTypes.func
  }),
  refetch: PropTypes.func
};
