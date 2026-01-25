import React from 'react';
import { Box, HStack, Text } from '@chakra-ui/react';
import PropTypes from 'prop-types';

function TreeNode({
  name,
  value,
  path,
  level,
  isSelected,
  isExpanded,
  isConfigured,
  onToggle,
  onClick,
  expandedPaths,
  configurations
}) {
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

    // Create merged template
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
    // Only allow toggle for level 0 and 1 (root and its direct children)
    // Level 2+ objects should zoom instead
    if ((isObject || isArray || isMergedArray) && level <= 1) {
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
        <Text
          fontSize="xs"
          color="gray.500"
          isTruncated
          maxW="200px"
        >
          {valueStr}
        </Text>
      );
    }

    // For level 2+ objects/arrays, show type indicator
    if (level > 1) {
      if (isArray && !isMergedArray) {
        return (
          <Text fontSize="xs" color="gray.400">
            [Array]
          </Text>
        );
      }
      if (isObject || isMergedArray) {
        return (
          <Text fontSize="xs" color="gray.400">
            [Object]
          </Text>
        );
      }
    }

    // Don't show [N] for merged arrays since it's in the name
    if (isArray && !isMergedArray && level <= 1) {
      return (
        <Text fontSize="xs" color="orange.500">
          [{value.length}]
        </Text>
      );
    }
    return null;
  };

  return (
    <Box>
      <HStack
        pl={level * 24 + 'px'}
        py={1.5}
        px={2}
        cursor="pointer"
        bg="transparent"
        _hover={{ bg: 'gray.50' }}
        borderRadius="sm"
        onClick={handleClick}
        gap={2}
      >
        {/* Expand/Collapse Icon - Only for level 0-1 */}
        {(isObject || isArray || isMergedArray) && level <= 1 && (
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
        )}

        {/* Empty space for level 2+ objects (no toggle arrow) */}
        {(isObject || isArray || isMergedArray) && level > 1 && <Box width="12px" />}

        {/* Empty space for primitives */}
        {isPrimitive && <Box width="12px" />}

        {/* Field Name */}
        <Text
          fontSize="sm"
          fontWeight="normal"
          color="gray.800"
          fontFamily={isPrimitive ? 'monospace' : 'inherit'}
        >
          {displayName}
        </Text>

        {/* Value Preview */}
        {renderValue()}

        {/* Configuration Status */}
        {isConfigured && (
          <Text fontSize="xs" color="green.500">
            ✓
          </Text>
        )}
      </HStack>

      {/* Children */}
      {isExpanded && (isObject || isArray || isMergedArray) && (
        <Box>
          {isMergedArray ? (
            // Render merged template fields directly
            Object.entries(displayValue).map(([key, val]) => {
              const childPath = `${path}[0].${key}`;
              return (
                <TreeNode
                  key={childPath}
                  name={key}
                  value={val}
                  path={childPath}
                  level={level + 1}
                  isSelected={path === childPath}
                  isExpanded={expandedPaths?.has(childPath) || false}
                  isConfigured={configurations?.[childPath] !== undefined}
                  onToggle={onToggle}
                  onClick={onClick}
                  expandedPaths={expandedPaths}
                  configurations={configurations}
                />
              );
            })
          ) : isArray ? (
            // For primitive arrays, show items directly
            value.map((item, idx) => {
              const childPath = `${path}[${idx}]`;
              return (
                <TreeNode
                  key={childPath}
                  name={`[${idx}]`}
                  value={item}
                  path={childPath}
                  level={level + 1}
                  isSelected={path === childPath}
                  isExpanded={expandedPaths?.has(childPath) || false}
                  isConfigured={configurations?.[childPath] !== undefined}
                  onToggle={onToggle}
                  onClick={onClick}
                  expandedPaths={expandedPaths}
                  configurations={configurations}
                />
              );
            })
          ) : (
            // Render object properties
            Object.entries(value).map(([key, val]) => {
              const childPath = `${path}.${key}`;
              return (
                <TreeNode
                  key={childPath}
                  name={key}
                  value={val}
                  path={childPath}
                  level={level + 1}
                  isSelected={path === childPath}
                  isExpanded={expandedPaths?.has(childPath) || false}
                  isConfigured={configurations?.[childPath] !== undefined}
                  onToggle={onToggle}
                  onClick={onClick}
                  expandedPaths={expandedPaths}
                  configurations={configurations}
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
  isSelected: PropTypes.bool,
  isExpanded: PropTypes.bool,
  isConfigured: PropTypes.bool,
  onToggle: PropTypes.func.isRequired,
  onClick: PropTypes.func.isRequired,
  expandedPaths: PropTypes.instanceOf(Set),
  configurations: PropTypes.object
};

export default TreeNode;
