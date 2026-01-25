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
import { useJsonTree } from '../../hooks/useJsonTree';
import { useAutoDetectType, useDefaultOptions } from '../../hooks/useFakerConfig';

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

  // Auto-detect type when a field is selected and auto-expand parent path
  useEffect(() => {
    if (selectedPath) {
      // Auto-expand the selected path if it's an object/array (for zooming)
      if (isObjectPath(selectedPath) || isArrayPath(selectedPath)) {
        expand(selectedPath);
      }

      // Auto-detect type for primitives
      if (isPrimitivePath(selectedPath) && !configurations[selectedPath]) {
        const fieldName = getFieldName(selectedPath);
        const detectedType = useAutoDetectType(fieldName);
        const defaultOptions = useDefaultOptions(detectedType);

        setConfigurations(prev => ({
          ...prev,
          [selectedPath]: {
            type: detectedType,
            options: defaultOptions
          }
        }));
      }
    }
  }, [selectedPath]);

  const handleConfigChange = (path, config) => {
    setConfigurations(prev => ({
      ...prev,
      [path]: config
    }));
  };

  const handleReset = () => {
    if (!selectedPath) return;

    const fieldName = getFieldName(selectedPath);
    const detectedType = useAutoDetectType(fieldName);
    const defaultOptions = useDefaultOptions(detectedType);

    setConfigurations(prev => ({
      ...prev,
      [selectedPath]: {
        type: detectedType,
        options: defaultOptions
      }
    }));
  };

  const handleKeepOriginal = () => {
    if (!selectedPath) return;

    setConfigurations(prev => ({
      ...prev,
      [selectedPath]: {
        type: 'Keep Original',
        options: {}
      }
    }));
  };

  const handleApplyToAll = (enabled) => {
    if (!selectedPath) return;

    setConfigurations(prev => ({
      ...prev,
      [selectedPath]: {
        ...prev[selectedPath],
        applyToAll: enabled
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

  const currentValue = selectedPath ? getValueAtPath(selectedPath) : null;
  const currentConfig = selectedPath ? configurations[selectedPath] : null;
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
    const fieldName = getFieldName(path);
    const allPaths = getAllPaths(jsonData, 'root');

    // If current path is in an array (e.g., items[0].company)
    // Find other instances in the same array (items[1].company, items[2].company)
    if (path.includes('[0]')) {
      const basePath = path.replace('[0]', '');
      const arrayPath = basePath.substring(0, basePath.lastIndexOf('.'));
      const arrayData = getValueAtPath(arrayPath);

      if (Array.isArray(arrayData) && arrayData.length > 1) {
        // Return paths for other array items
        const fieldPath = path.split('[0].')[1];
        return arrayData.slice(1).map((_, idx) =>
          `${arrayPath}[${idx + 1}].${fieldPath}`
        );
      }
    }

    // For non-array fields, find other fields with same name in DIFFERENT objects
    return allPaths.filter(p =>
      p !== path &&
      getFieldName(p) === fieldName &&
      isPrimitivePath(p) &&
      !p.includes('[0]') // Exclude array template items from cross-object matching
    );
  };

  const similarFields = selectedPath ? findSimilarFields(selectedPath) : [];
  const canApplyToAll = selectedPath && isPrimitive && similarFields.length > 0;
  const isArrayItem = selectedPath ? selectedPath.includes('[0]') : false;

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
          maxH="80vh"
        >
          <DialogHeader>
            <DialogTitle>Randomize / Anonymize</DialogTitle>
          </DialogHeader>

          <DialogBody>
            <HStack align="stretch" gap={4} minH="500px">
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
                  />
                ) : (
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    height="100%"
                  >
                    <Text color="gray.500" fontSize="sm">
                      Select a field or array to configure
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
              colorPalette="blue"
              size="sm"
              onClick={handleApply}
            >
              Apply Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Portal>
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
