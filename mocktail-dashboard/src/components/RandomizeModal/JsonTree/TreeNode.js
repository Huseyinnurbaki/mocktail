import React from 'react';
import { Box, HStack, Text, Badge } from '@chakra-ui/react';
import PropTypes from 'prop-types';

function TreeNode({
  name,
  value,
  path,
  level,
  selectedPath,
  isExpanded,
  isConfigured,
  onToggle,
  onClick,
  expandedPaths,
  configurations
}) {
  // Normalize path to check for configurations (convert .0. to [0])
  const normalizePath = (p) => {
    if (!p) return p;
    let normalized = p.replace(/\.(\d+)\./g, '[$1].');
    normalized = normalized.replace(/\.(\d+)$/, '[$1]');
    return normalized;
  };

  const normalizedPath = normalizePath(path);
  const isActuallyConfigured = configurations?.[normalizedPath] !== undefined;
  const dotPath = (p) => p?.replace(/\[(\d+)\]/g, '.$1') || '';
  const isSelected = dotPath(selectedPath) === dotPath(path);

  const isArray = Array.isArray(value);
  const isObject = typeof value === 'object' && value !== null && !isArray;
  const isPrimitive = !isObject && !isArray;

  // For arrays of objects, create merged template
  let displayName = name;
  let displayValue = value;
  let isMergedArray = false;

  if (isArray && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
    isMergedArray = true;
    displayName = `${name} [${value.length} items]`;

    const mergedTemplate = {};
    value.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        Object.keys(item).forEach(key => {
          if (mergedTemplate[key] === undefined) {
            mergedTemplate[key] = item[key];
          }
        });
      }
    });
    displayValue = mergedTemplate;
  }

  const handleToggle = (e) => {
    e.stopPropagation();
    if (isObject || isArray || isMergedArray) {
      onToggle(path);
    }
  };

  const handleClick = () => {
    onClick(path);
  };

  const renderValue = () => {
    if (isPrimitive) {
      const valueStr = String(value);
      return (
        <Text fontSize="xs" color="gray.500" isTruncated maxW="200px">
          {valueStr}
        </Text>
      );
    }

    if (level > 1) {
      if (isArray && !isMergedArray) {
        return <Text fontSize="xs" color="gray.400">[Array]</Text>;
      }
      if (isObject || isMergedArray) {
        return <Text fontSize="xs" color="gray.400">[Object]</Text>;
      }
    }

    if (isArray && !isMergedArray && level <= 1) {
      return <Text fontSize="xs" color="orange.500">[{value.length}]</Text>;
    }
    return null;
  };

  const sharedChildProps = {
    selectedPath,
    isExpanded: false,
    onToggle,
    onClick,
    expandedPaths,
    configurations,
  };

  return (
    <Box>
      <HStack
        pl={level * 24 + 'px'}
        py={1.5}
        px={2}
        cursor="pointer"
        bg={isSelected ? 'blue.50' : 'transparent'}
        _hover={{ bg: isSelected ? 'blue.50' : 'gray.50' }}
        borderRadius="sm"
        onClick={handleClick}
        gap={2}
      >
        {/* Expand/Collapse Icon */}
        {(isObject || isArray || isMergedArray) ? (
          <Text
            fontSize="xs"
            color="gray.500"
            onClick={handleToggle}
            cursor="pointer"
            userSelect="none"
            width="12px"
          >
            {isExpanded ? '▼' : '▶'}
          </Text>
        ) : (
          <Box width="12px" />
        )}

        {/* Field Name */}
        <Text
          fontSize="sm"
          fontWeight="normal"
          color="gray.800"
          fontFamily={isPrimitive ? 'monospace' : 'inherit'}
        >
          {displayName}
        </Text>

        {/* Configuration Indicator */}
        {isActuallyConfigured && configurations[normalizedPath] && (
          <Badge size="xs" colorPalette="green" variant="subtle">
            {configurations[normalizedPath].type || 'Configured'}
          </Badge>
        )}

        {/* Value Preview - Commented out to keep tree cleaner
        {renderValue()}
        */}
      </HStack>

      {/* Children */}
      {isExpanded && (isObject || isArray || isMergedArray) && (
        <Box>
          {isMergedArray ? (
            Object.entries(displayValue).map(([key, val]) => {
              const childPath = `${path}[0].${key}`;
              const normalizedChildPath = normalizePath(childPath);
              return (
                <TreeNode
                  key={childPath}
                  name={key}
                  value={val}
                  path={childPath}
                  level={level + 1}
                  {...sharedChildProps}
                  isExpanded={expandedPaths?.has(childPath) || false}
                  isConfigured={configurations?.[normalizedChildPath] !== undefined}
                />
              );
            })
          ) : isArray ? (
            value.map((item, idx) => {
              const childPath = `${path}[${idx}]`;
              const normalizedChildPath = normalizePath(childPath);
              return (
                <TreeNode
                  key={childPath}
                  name={`[${idx}]`}
                  value={item}
                  path={childPath}
                  level={level + 1}
                  {...sharedChildProps}
                  isExpanded={expandedPaths?.has(childPath) || false}
                  isConfigured={configurations?.[normalizedChildPath] !== undefined}
                />
              );
            })
          ) : (
            Object.entries(value).map(([key, val]) => {
              const childPath = `${path}.${key}`;
              const normalizedChildPath = normalizePath(childPath);
              return (
                <TreeNode
                  key={childPath}
                  name={key}
                  value={val}
                  path={childPath}
                  level={level + 1}
                  {...sharedChildProps}
                  isExpanded={expandedPaths?.has(childPath) || false}
                  isConfigured={configurations?.[normalizedChildPath] !== undefined}
                />
              );
            })
          )}
        </Box>
      )}
    </Box>
  );
}

TreeNode.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.any,
  path: PropTypes.string.isRequired,
  level: PropTypes.number.isRequired,
  selectedPath: PropTypes.string,
  isExpanded: PropTypes.bool,
  isConfigured: PropTypes.bool,
  onToggle: PropTypes.func.isRequired,
  onClick: PropTypes.func.isRequired,
  expandedPaths: PropTypes.instanceOf(Set),
  configurations: PropTypes.object
};

export default TreeNode;
