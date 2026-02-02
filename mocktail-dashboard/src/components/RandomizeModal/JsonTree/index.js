import React from 'react';
import { Box, VStack, Text, Button, HStack } from '@chakra-ui/react';
import PropTypes from 'prop-types';
import TreeNode from './TreeNode';

function JsonTree({
  data,
  selectedPath,
  expandedPaths,
  configurations,
  onSelectNode,
  onToggleExpand,
  onExpand
}) {
  // Determine the focus level based on selected path depth
  const getFocusPath = () => {
    if (!selectedPath || selectedPath === 'root') return 'root';

    // Get path parts
    const parts = selectedPath.replace('root.', '').split(/\.|\[|\]/).filter(Boolean);

    // If it's a shallow path, show from root
    if (parts.length <= 1) return 'root';

    // For objects and arrays, zoom to the parent level
    // Find the last object/array in the path
    let focusParts = [];
    for (let i = parts.length - 1; i >= 0; i--) {
      const testPath = `root.${parts.slice(0, i + 1).join('.')}`;
      const testValue = getDataAtPath(data, testPath);
      if (typeof testValue === 'object' && testValue !== null) {
        focusParts = parts.slice(0, i + 1);
        break;
      }
    }

    return focusParts.length > 0 ? `root.${focusParts.join('.')}` : 'root';
  };

  const focusPath = getFocusPath();
  const focusData = focusPath === 'root' ? data : getDataAtPath(data, focusPath);

  // Auto-expand focus path when it changes, and collapse when zooming out
  React.useEffect(() => {
    if (focusPath && focusPath !== 'root') {
      onExpand(focusPath);
    }
  }, [focusPath, onExpand]);

  // Build breadcrumb navigation
  const buildBreadcrumbs = () => {
    if (!selectedPath || selectedPath === 'root') return [];

    const parts = selectedPath.replace('root.', '').split(/\.|\[|\]/).filter(Boolean);
    const breadcrumbs = [];
    let currentPath = 'root';

    parts.forEach((part, idx) => {
      if (idx === 0) {
        currentPath = part;
      } else {
        currentPath = `${currentPath}.${part}`;
      }
      breadcrumbs.push({
        label: part,
        path: currentPath
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = buildBreadcrumbs();

  // Helper to get data at path
  function getDataAtPath(obj, path) {
    if (path === 'root') return obj;
    const keys = path.replace('root.', '').split(/\.|\[|\]/).filter(Boolean);
    return keys.reduce((acc, key) => acc?.[key], obj);
  }
  if (!data || typeof data !== 'object') {
    return (
      <Box p={4} textAlign="center">
        <Text color="gray.500" fontSize="sm">
          No JSON data to display
        </Text>
      </Box>
    );
  }

  const isConfigured = (path) => {
    return configurations && configurations[path] !== undefined;
  };

  const isExpanded = (path) => {
    return expandedPaths.has(path);
  };

  return (
    <VStack align="stretch" gap={2} height="100%">
      <Box
        borderBottom="1px solid"
        borderColor="gray.200"
        pb={2}
        mb={2}
      >
        <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={2}>
          JSON Structure
        </Text>

        {/* Breadcrumb Navigation - Always Show */}
        <Box
          overflowX="auto"
          py={1}
          minH="26px"
          css={{
            '&::-webkit-scrollbar': {
              height: '4px'
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#CBD5E0',
              borderRadius: '4px'
            }
          }}
        >
          <HStack
            gap={1}
            flexWrap="nowrap"
          >
          <Text
            fontSize="xs"
            color={breadcrumbs.length === 0 ? 'gray.700' : 'gray.500'}
            cursor={breadcrumbs.length === 0 ? 'default' : 'pointer'}
            onClick={() => breadcrumbs.length > 0 && onSelectNode('root')}
            _hover={breadcrumbs.length > 0 ? { color: 'blue.600' } : {}}
            fontWeight={breadcrumbs.length === 0 ? 'medium' : 'normal'}
            flexShrink={0}
          >
            root
          </Text>
          {breadcrumbs.map((crumb, idx) => (
            <HStack key={idx} gap={1} flexShrink={0}>
              <Text fontSize="xs" color="gray.400">›</Text>
              <Text
                fontSize="xs"
                color={idx === breadcrumbs.length - 1 ? 'gray.700' : 'gray.500'}
                cursor={idx === breadcrumbs.length - 1 ? 'default' : 'pointer'}
                onClick={() => idx < breadcrumbs.length - 1 && onSelectNode(`root.${crumb.path}`)}
                _hover={idx < breadcrumbs.length - 1 ? { color: 'blue.600' } : {}}
                fontWeight={idx === breadcrumbs.length - 1 ? 'medium' : 'normal'}
                flexShrink={0}
              >
                {crumb.label}
              </Text>
            </HStack>
          ))}
          </HStack>
        </Box>
      </Box>

      <Box
        flex="1"
        overflowY="auto"
        overflowX="hidden"
        pr={2}
      >
        <TreeNode
          name={focusPath === 'root' ? 'root' : focusPath.split('.').pop()}
          value={focusData}
          path={focusPath}
          level={0}
          isSelected={selectedPath === focusPath}
          isExpanded={isExpanded(focusPath)}
          isConfigured={isConfigured(focusPath)}
          onToggle={onToggleExpand}
          onClick={onSelectNode}
          expandedPaths={expandedPaths}
          configurations={configurations}
        />
      </Box>

      {/* Add Field Button - Future Enhancement */}
      {/* <Button
        variant="ghost"
        size="sm"
        width="full"
        colorPalette="gray"
      >
        + Add Field
      </Button> */}
    </VStack>
  );
}

JsonTree.propTypes = {
  data: PropTypes.object.isRequired,
  selectedPath: PropTypes.string,
  expandedPaths: PropTypes.instanceOf(Set),
  configurations: PropTypes.object,
  onSelectNode: PropTypes.func.isRequired,
  onToggleExpand: PropTypes.func.isRequired,
  onExpand: PropTypes.func.isRequired
};

JsonTree.defaultProps = {
  expandedPaths: new Set(),
  configurations: {}
};

export default JsonTree;
