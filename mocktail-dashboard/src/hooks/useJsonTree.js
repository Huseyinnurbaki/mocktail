import { useState, useCallback } from 'react';

/**
 * Manage JSON tree state
 * @param {object} jsonData - The JSON data to display
 * @returns {object} Tree state and actions
 */
export function useJsonTree(jsonData) {
  // Initialize with root and level-1 arrays/objects expanded
  const getInitialExpanded = () => {
    const expanded = new Set(['root']);
    if (jsonData && typeof jsonData === 'object' && !Array.isArray(jsonData)) {
      Object.keys(jsonData).forEach(key => {
        const value = jsonData[key];
        // Expand level 1 arrays and objects
        if (typeof value === 'object' && value !== null) {
          expanded.add(`root.${key}`);
        }
      });
    }
    return expanded;
  };

  const [expandedPaths, setExpandedPaths] = useState(getInitialExpanded());
  const [selectedPath, setSelectedPath] = useState(null);

  const toggleExpand = useCallback((path) => {
    setExpandedPaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const expand = useCallback((path) => {
    setExpandedPaths(prev => {
      const next = new Set(prev);
      next.add(path);
      return next;
    });
  }, []);

  const isExpanded = useCallback((path) => {
    return expandedPaths.has(path);
  }, [expandedPaths]);

  const selectNode = useCallback((path) => {
    setSelectedPath(path);
  }, []);

  const getValueAtPath = useCallback((path) => {
    if (!path || path === 'root') return jsonData;

    const keys = path.replace('root.', '').split(/\.|\[|\]/).filter(Boolean);
    return keys.reduce((obj, key) => {
      if (obj === undefined || obj === null) return undefined;
      return obj[key];
    }, jsonData);
  }, [jsonData]);

  const getFieldName = useCallback((path) => {
    if (!path) return '';
    const parts = path.split('.');
    return parts[parts.length - 1].replace(/\[\d+\]/, '');
  }, []);

  const isArrayPath = useCallback((path) => {
    const value = getValueAtPath(path);
    return Array.isArray(value);
  }, [getValueAtPath]);

  const isObjectPath = useCallback((path) => {
    const value = getValueAtPath(path);
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }, [getValueAtPath]);

  const isPrimitivePath = useCallback((path) => {
    const value = getValueAtPath(path);
    return typeof value !== 'object' || value === null;
  }, [getValueAtPath]);

  return {
    expandedPaths,
    selectedPath,
    toggleExpand,
    expand,
    isExpanded,
    selectNode,
    getValueAtPath,
    getFieldName,
    isArrayPath,
    isObjectPath,
    isPrimitivePath
  };
}
