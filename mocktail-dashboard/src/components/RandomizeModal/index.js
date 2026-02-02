import React, { useState, useEffect } from 'react';
import {
  DialogRoot,
  DialogBackdrop,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  Button,
  HStack,
  Portal,
  DialogActionTrigger,
  Text,
  Box
} from '@chakra-ui/react';
import PropTypes from 'prop-types';
import JsonTree from './JsonTree';
import FieldConfigPanel from './FieldConfigPanel';
import ArrayConfigPanel from './ArrayConfigPanel';
import ObjectConfigPanel from './ObjectConfigPanel';
import ReviewModal from './ReviewModal';
import { useJsonTree } from '../../hooks/useJsonTree';
import { useAutoDetectType, useDefaultOptions } from '../../hooks/useFakerConfig';
import { detectReferences } from '../../utils/referenceDetection';

function RandomizeModal({ isOpen, onClose, jsonData, onApply }) {
  const {
    expandedPaths,
    selectedPath,
    toggleExpand,
    expand,
    selectNode,
    getValueAtPath,
    getFieldName,
    isArrayPath,
    isObjectPath,
    isPrimitivePath
  } = useJsonTree(jsonData);

  const [configurations, setConfigurations] = useState({});
  const [referenceMetadata, setReferenceMetadata] = useState({});
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  // Helper to normalize path: convert dot notation for arrays to bracket notation
  const normalizePath = (path) => {
    if (!path) return path;
    // Convert .0. or .1. etc to [0]. or [1].
    let normalized = path.replace(/\.(\d+)\./g, '[$1].');
    // Convert .0 or .1 at end to [0] or [1]
    normalized = normalized.replace(/\.(\d+)$/, '[$1]');
    return normalized;
  };

  // Auto-detect type when a field is selected and auto-expand parent path
  useEffect(() => {
    if (selectedPath) {
      // Auto-expand the selected path if it's an object/array (for zooming)
      if (isObjectPath(selectedPath) || isArrayPath(selectedPath)) {
        expand(selectedPath);
      }

      // Auto-detect type for primitives
      const normalizedSelectedPath = normalizePath(selectedPath);
      if (isPrimitivePath(selectedPath) && !configurations[normalizedSelectedPath]) {
        const fieldName = getFieldName(normalizedSelectedPath);
        const detectedType = useAutoDetectType(fieldName);
        const defaultOptions = useDefaultOptions(detectedType);

        setConfigurations(prev => ({
          ...prev,
          [normalizedSelectedPath]: {
            type: detectedType,
            options: defaultOptions
          }
        }));
      }

      // Detect references for arrays
      // Extract array path if this is an array item or array itself
      let arrayPathToAnalyze = null;
      let arrayDataToAnalyze = null;

      if (normalizedSelectedPath.includes('[')) {
        // Path is within an array (e.g., "root.items[0].field" or "root.items[2].id")
        arrayPathToAnalyze = normalizedSelectedPath.substring(0, normalizedSelectedPath.indexOf('['));
        arrayDataToAnalyze = getValueAtPath(arrayPathToAnalyze);
      } else if (isArrayPath(normalizedSelectedPath)) {
        // Path is the array itself
        arrayPathToAnalyze = normalizedSelectedPath;
        arrayDataToAnalyze = getValueAtPath(normalizedSelectedPath);
      }

      // Run reference detection if we have an array to analyze
      if (arrayPathToAnalyze && Array.isArray(arrayDataToAnalyze) && arrayDataToAnalyze.length > 0) {
        // Only run if we haven't detected for this array yet (performance optimization)
        if (!referenceMetadata[arrayPathToAnalyze]) {
          const refMap = detectReferences(arrayDataToAnalyze, arrayPathToAnalyze);
          setReferenceMetadata(prev => ({
            ...prev,
            [arrayPathToAnalyze]: refMap
          }));
        }
      }
    }
  }, [selectedPath]);

  const handleConfigChange = (path, config) => {
    // Normalize path before storing
    const normalizedPath = normalizePath(path);
    setConfigurations(prev => ({
      ...prev,
      [normalizedPath]: config
    }));
  };

  const handleReset = () => {
    if (!selectedPath) return;

    const normalizedPath = normalizePath(selectedPath);
    const fieldName = getFieldName(normalizedPath);
    const detectedType = useAutoDetectType(fieldName);
    const defaultOptions = useDefaultOptions(detectedType);

    setConfigurations(prev => ({
      ...prev,
      [normalizedPath]: {
        type: detectedType,
        options: defaultOptions
      }
    }));
  };

  const handleKeepOriginal = () => {
    if (!selectedPath) return;

    const normalizedPath = normalizePath(selectedPath);
    setConfigurations(prev => ({
      ...prev,
      [normalizedPath]: {
        type: 'Keep Original',
        options: {}
      }
    }));
  };

  const handleApplyToAll = (enabled) => {
    if (!selectedPath) return;

    const normalizedPath = normalizePath(selectedPath);
    setConfigurations(prev => ({
      ...prev,
      [normalizedPath]: {
        ...prev[normalizedPath],
        applyToAll: enabled
      }
    }));
  };

  const handleUpdateReferences = (enabled) => {
    if (!selectedPath) return;

    const normalizedPath = normalizePath(selectedPath);
    setConfigurations(prev => ({
      ...prev,
      [normalizedPath]: {
        ...prev[normalizedPath],
        updateReferences: enabled
      }
    }));
  };

  // Helper function to get all paths in JSON
  const getAllPaths = (obj, basePath) => {
    const paths = [];

    const traverse = (current, path) => {
      if (typeof current === 'object' && current !== null) {
        if (Array.isArray(current)) {
          // Only add template item [0]
          if (current.length > 0) {
            traverse(current[0], `${path}[0]`);
          }
        } else {
          Object.keys(current).forEach(key => {
            const newPath = path ? `${path}.${key}` : key;
            paths.push(newPath);
            traverse(current[key], newPath);
          });
        }
      }
    };

    traverse(obj, basePath);
    return paths;
  };

  const handleApply = () => {
    onApply(configurations);
    onClose();
  };

  const handleReview = () => {
    setIsReviewOpen(true);
  };

  const handleRemoveConfig = (path) => {
    setConfigurations(prev => {
      const newConfig = { ...prev };
      delete newConfig[path];
      return newConfig;
    });
  };

  const handleApplyFromReview = () => {
    setIsReviewOpen(false);
    onApply(configurations);
    onClose();
  };

  const currentValue = selectedPath ? getValueAtPath(selectedPath) : null;
  const currentConfig = selectedPath ? configurations[normalizePath(selectedPath)] : null;
  const isArray = selectedPath ? isArrayPath(selectedPath) : false;
  const isPrimitive = selectedPath ? isPrimitivePath(selectedPath) : false;

  // Check if this is a merged template node (ends with [0] and parent is an array)
  const isMergedTemplate = selectedPath && selectedPath.endsWith('[0]') && isObjectPath(selectedPath);
  const parentArrayPath = isMergedTemplate ? selectedPath.substring(0, selectedPath.lastIndexOf('[0]')) : null;
  const parentArrayData = parentArrayPath ? getValueAtPath(parentArrayPath) : null;

  // Check if "Apply to All" should be available
  // Find all paths with the same field name
  const findSimilarFields = (path) => {
    if (!path) return [];

    // Normalize path first
    const normalizedPath = normalizePath(path);

    const fieldName = getFieldName(normalizedPath);
    const allPaths = getAllPaths(jsonData, 'root');

    // If current path is in an array (e.g., items[0].links.parent_job_id)
    if (normalizedPath.includes('[')) {
      const arrayPath = normalizedPath.substring(0, normalizedPath.indexOf('['));
      const arrayData = getValueAtPath(arrayPath);

      if (!Array.isArray(arrayData) || arrayData.length <= 1) return [];

      // Get relative path within array item (e.g., "links.parent_job_id")
      const relativePath = normalizedPath.split(/\[\d+\]\./)[1];
      if (!relativePath) return [];

      // Find other items that have this same nested path
      const similarPaths = [];
      arrayData.forEach((item, idx) => {
        if (idx === 0) return; // Skip first item

        // Check if this path exists in this item by traversing
        const keys = relativePath.split('.');
        let current = item;
        let pathExists = true;

        for (const key of keys) {
          if (!current || typeof current !== 'object' || !current.hasOwnProperty(key)) {
            pathExists = false;
            break;
          }
          current = current[key];
        }

        // Only add if path actually exists in this item
        if (pathExists) {
          similarPaths.push(`${arrayPath}[${idx}].${relativePath}`);
        }
      });

      return similarPaths;
    }

    // For non-array fields, find other fields with same name in DIFFERENT objects
    return allPaths.filter(p =>
      p !== normalizedPath &&
      getFieldName(p) === fieldName &&
      isPrimitivePath(p) &&
      !p.includes('[') // Exclude array items from cross-object matching
    );
  };

  const similarFields = selectedPath ? findSimilarFields(selectedPath) : [];
  console.log('Selected path:', selectedPath);
  console.log('Similar fields found:', similarFields);
  console.log('Is primitive:', isPrimitive);
  const canApplyToAll = selectedPath && isPrimitive && similarFields.length > 0;
  const isArrayItem = selectedPath ? selectedPath.includes('[0]') : false;

  // Get reference data for selected path
  const getReferencedByPaths = (path) => {
    if (!path) return [];

    // Normalize path first
    const normalizedPath = normalizePath(path);

    // Find which array this path belongs to
    let arrayPath = null;
    if (normalizedPath.includes('[')) {
      arrayPath = normalizedPath.substring(0, normalizedPath.indexOf('['));
    }

    if (!arrayPath || !referenceMetadata[arrayPath]) return [];

    // Get reference map for this array
    const refMap = referenceMetadata[arrayPath];

    return refMap[normalizedPath]?.referencedBy || [];
  };

  const getReferencedField = (path) => {
    if (!path) return null;

    // Normalize path first
    const normalizedPath = normalizePath(path);

    // Find which array this path belongs to
    let arrayPath = null;
    if (normalizedPath.includes('[')) {
      arrayPath = normalizedPath.substring(0, normalizedPath.indexOf('['));
    }

    if (!arrayPath || !referenceMetadata[arrayPath]) return null;

    // Get reference map for this array
    const refMap = referenceMetadata[arrayPath];

    // Check if this path is referenced in any field
    for (const [fieldPath, data] of Object.entries(refMap)) {
      if (data.referencedBy.includes(normalizedPath)) {
        return fieldPath;
      }
    }

    return null;
  };

  const referencedByPaths = selectedPath ? getReferencedByPaths(selectedPath) : [];
  const referencedField = selectedPath ? getReferencedField(selectedPath) : null;

  return (
    <DialogRoot open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
      <Portal>
        <DialogBackdrop />
        <DialogContent
          position="fixed"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          maxW="1200px"
          height="80vh"
          display="flex"
          flexDirection="column"
        >
          <DialogHeader>
            <DialogTitle>Randomize / Anonymize</DialogTitle>
          </DialogHeader>

          <DialogBody flex="1" overflow="hidden">
            <HStack align="stretch" gap={4} height="100%">
              {/* Left Side - JSON Tree */}
              <Box
                width="40%"
                borderRight="1px solid"
                borderColor="gray.200"
                pr={4}
                overflowY="auto"
              >
                <JsonTree
                  data={jsonData}
                  selectedPath={selectedPath}
                  expandedPaths={expandedPaths}
                  configurations={configurations}
                  onSelectNode={selectNode}
                  onToggleExpand={toggleExpand}
                  onExpand={expand}
                />
              </Box>

              {/* Right Side - Configuration Panel */}
              <Box width="60%" overflowY="auto">
                {!selectedPath ? (
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    height="100%"
                  >
                    <Text color="gray.500" fontSize="sm">
                      Select a field to configure
                    </Text>
                  </Box>
                ) : isArray || isMergedTemplate ? (
                  <ArrayConfigPanel
                    path={isMergedTemplate ? parentArrayPath : selectedPath}
                    arrayData={isMergedTemplate ? parentArrayData : currentValue}
                    config={currentConfig || {}}
                    onChange={(config) => handleConfigChange(selectedPath, config)}
                  />
                ) : isPrimitive ? (
                  <FieldConfigPanel
                    path={selectedPath}
                    currentValue={currentValue}
                    config={currentConfig || {}}
                    onChange={(config) => handleConfigChange(selectedPath, config)}
                    onReset={handleReset}
                    onKeepOriginal={handleKeepOriginal}
                    canApplyToAll={canApplyToAll}
                    onApplyToAll={handleApplyToAll}
                    similarFieldsCount={similarFields.length}
                    isArrayItem={isArrayItem}
                    referencedBy={referencedByPaths}
                    referencesField={referencedField}
                    onUpdateReferences={handleUpdateReferences}
                  />
                ) : isObjectPath(selectedPath) ? (
                  <ObjectConfigPanel
                    path={selectedPath}
                    objectData={currentValue}
                  />
                ) : (
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    height="100%"
                  >
                    <Text color="gray.500" fontSize="sm">
                      Select a field to configure
                    </Text>
                  </Box>
                )}
              </Box>
            </HStack>
          </DialogBody>

          <DialogFooter gap={2}>
            <DialogActionTrigger asChild>
              <Button variant="outline" size="sm">
                Cancel
              </Button>
            </DialogActionTrigger>
            <Button
              variant="outline"
              colorPalette="blue"
              size="sm"
              onClick={handleReview}
            >
              Review
            </Button>
            <Button
              colorPalette="blue"
              size="sm"
              onClick={handleApply}
            >
              Apply Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Portal>

      {/* Review Modal */}
      <ReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        configurations={configurations}
        onRemove={handleRemoveConfig}
        onApply={handleApplyFromReview}
      />
    </DialogRoot>
  );
}

RandomizeModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  jsonData: PropTypes.object.isRequired,
  onApply: PropTypes.func.isRequired
};

export default RandomizeModal;
