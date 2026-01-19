import React, { useState } from 'react';
import { Box, Text, HStack, VStack, Input } from '@chakra-ui/react';
import PropTypes from 'prop-types';

const JsonTreeViewer = ({ data, onChange, editable = false }) => {
  const [collapsed, setCollapsed] = useState({});
  const [editing, setEditing] = useState(null);
  const [editValue, setEditValue] = useState('');

  const toggleCollapse = (key) => {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const startEdit = (path, value) => {
    if (!editable) return;
    setEditing(path);
    if (typeof value === 'string') {
      setEditValue(value);
    } else {
      setEditValue(JSON.stringify(value));
    }
  };

  const finishEdit = (path) => {
    if (!onChange) return;

    try {
      // Try to parse as JSON first
      let newValue;
      try {
        newValue = JSON.parse(editValue);
      } catch {
        // If not valid JSON, treat as string
        newValue = editValue;
      }

      // Update the data at the given path
      const pathParts = path.split('.').filter(p => p && p !== 'root');
      const newData = JSON.parse(JSON.stringify(data)); // Deep clone

      if (pathParts.length === 0) {
        onChange(newValue);
      } else {
        let current = newData;
        for (let i = 0; i < pathParts.length - 1; i++) {
          current = current[pathParts[i]];
        }
        current[pathParts[pathParts.length - 1]] = newValue;
        onChange(newData);
      }
    } catch (error) {
      console.error('Failed to update value:', error);
    }

    setEditing(null);
    setEditValue('');
  };

  const renderValue = (value, key, path) => {
    const fullPath = `${path}.${key}`;
    const isEditing = editing === fullPath;

    if (isEditing) {
      return (
        <Input
          size="xs"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => finishEdit(fullPath)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') finishEdit(fullPath);
            if (e.key === 'Escape') {
              setEditing(null);
              setEditValue('');
            }
          }}
          autoFocus
          fontFamily="mono"
          fontSize="sm"
        />
      );
    }

    if (value === null) {
      return (
        <Text
          as="span"
          color="gray.500"
          cursor={editable ? "pointer" : "default"}
          onClick={() => startEdit(fullPath, value)}
          _hover={editable ? { bg: "gray.100" } : {}}
          px={editable ? 1 : 0}
          borderRadius="sm"
        >
          null
        </Text>
      );
    }

    if (typeof value === 'boolean') {
      return (
        <Text
          as="span"
          color="purple.600"
          cursor={editable ? "pointer" : "default"}
          onClick={() => startEdit(fullPath, value)}
          _hover={editable ? { bg: "gray.100" } : {}}
          px={editable ? 1 : 0}
          borderRadius="sm"
        >
          {value.toString()}
        </Text>
      );
    }

    if (typeof value === 'number') {
      return (
        <Text
          as="span"
          color="blue.600"
          cursor={editable ? "pointer" : "default"}
          onClick={() => startEdit(fullPath, value)}
          _hover={editable ? { bg: "gray.100" } : {}}
          px={editable ? 1 : 0}
          borderRadius="sm"
        >
          {value}
        </Text>
      );
    }

    if (typeof value === 'string') {
      return (
        <Text
          as="span"
          color="green.600"
          cursor={editable ? "pointer" : "default"}
          onClick={() => startEdit(fullPath, value)}
          _hover={editable ? { bg: "gray.100" } : {}}
          px={editable ? 1 : 0}
          borderRadius="sm"
        >
          "{value}"
        </Text>
      );
    }

    if (Array.isArray(value)) {
      const isCollapsed = collapsed[fullPath];
      const isEmpty = value.length === 0;

      return (
        <VStack align="stretch" gap={0}>
          <HStack gap={1}>
            {!isEmpty && (
              <Text
                as="span"
                cursor="pointer"
                userSelect="none"
                onClick={() => toggleCollapse(fullPath)}
                color="gray.500"
                fontWeight="bold"
                fontSize="sm"
                _hover={{ color: "gray.700" }}
              >
                {isCollapsed ? '▶' : '▼'}
              </Text>
            )}
            <Text as="span" color="gray.600">
              [{isEmpty ? '' : value.length}]
            </Text>
          </HStack>
          {!isEmpty && !isCollapsed && (
            <VStack align="stretch" pl={4} gap={1} mt={1}>
              {value.map((item, index) => (
                <HStack key={index} gap={2} align="flex-start">
                  <Text color="gray.500" fontSize="xs" minW="20px">{index}:</Text>
                  {renderValue(item, index, fullPath)}
                </HStack>
              ))}
            </VStack>
          )}
        </VStack>
      );
    }

    if (typeof value === 'object') {
      const isCollapsed = collapsed[fullPath];
      const keys = Object.keys(value);
      const isEmpty = keys.length === 0;

      return (
        <VStack align="stretch" gap={0}>
          <HStack gap={1}>
            {!isEmpty && (
              <Text
                as="span"
                cursor="pointer"
                userSelect="none"
                onClick={() => toggleCollapse(fullPath)}
                color="gray.500"
                fontWeight="bold"
                fontSize="sm"
                _hover={{ color: "gray.700" }}
              >
                {isCollapsed ? '▶' : '▼'}
              </Text>
            )}
            <Text as="span" color="gray.600">
              {'{'}
              {isEmpty ? '}' : ''}
            </Text>
          </HStack>
          {!isEmpty && !isCollapsed && (
            <VStack align="stretch" pl={4} gap={1} mt={1}>
              {keys.map(objKey => (
                <HStack key={objKey} gap={2} align="flex-start">
                  <Text color="red.600" fontSize="sm">"{objKey}":</Text>
                  {renderValue(value[objKey], objKey, fullPath)}
                </HStack>
              ))}
              <Text color="gray.600">{'}'}</Text>
            </VStack>
          )}
          {isEmpty && null}
        </VStack>
      );
    }

    return <Text as="span">{String(value)}</Text>;
  };

  return (
    <Box
      fontFamily="mono"
      fontSize="sm"
      p={3}
      bg="gray.50"
      borderRadius="md"
      border="1px solid"
      borderColor="gray.200"
      maxH="400px"
      overflowY="auto"
    >
      {renderValue(data, 'root', '')}
    </Box>
  );
};

JsonTreeViewer.propTypes = {
  data: PropTypes.any.isRequired,
  onChange: PropTypes.func,
  editable: PropTypes.bool
};

export default JsonTreeViewer;
