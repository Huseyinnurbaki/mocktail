/**
 * Reference Detection Utility
 * Detects cross-references between fields in array items
 */

/**
 * Get all paths in a data structure recursively
 * @param {any} data - Data to traverse
 * @param {string} basePath - Base path
 * @param {Set} visited - Visited objects (for cycle detection)
 * @returns {string[]} Array of all paths
 */
function getAllPaths(data, basePath = 'root', visited = new Set()) {
  const paths = [];

  // Prevent infinite loops from circular references
  if (typeof data === 'object' && data !== null) {
    if (visited.has(data)) return paths;
    visited.add(data);
  }

  if (Array.isArray(data)) {
    // For arrays, use [0] template notation
    if (data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
      // Array of objects - build merged template
      const mergedTemplate = {};
      data.forEach(item => {
        if (typeof item === 'object' && item !== null) {
          Object.keys(item).forEach(key => {
            if (mergedTemplate[key] === undefined) {
              mergedTemplate[key] = item[key];
            }
          });
        }
      });

      // Recurse into merged template
      Object.keys(mergedTemplate).forEach(key => {
        const childPath = `${basePath}[0].${key}`;
        paths.push(...getAllPaths(mergedTemplate[key], childPath, new Set(visited)));
      });
    }
  } else if (typeof data === 'object' && data !== null) {
    // Object
    Object.keys(data).forEach(key => {
      const childPath = basePath === 'root' ? `root.${key}` : `${basePath}.${key}`;
      paths.push(...getAllPaths(data[key], childPath, new Set(visited)));
    });
  } else {
    // Primitive - add this path
    paths.push(basePath);
  }

  return paths;
}

/**
 * Get value at a specific path in data
 * @param {any} data - Data to traverse
 * @param {string} path - Path to value
 * @returns {any} Value at path, or undefined if not found
 */
function getValueAtPath(data, path) {
  if (!path || path === 'root') return data;

  const keys = path.replace('root.', '').split(/\.|\[|\]/).filter(Boolean);
  return keys.reduce((obj, key) => {
    if (obj === undefined || obj === null) return undefined;
    return obj[key];
  }, data);
}

/**
 * Extract field name from path (removes indices)
 * @param {string} path - Path like "root.items[0].links.parent_job_id"
 * @returns {string} Field name like "parent_job_id"
 */
export function getFieldName(path) {
  if (!path) return '';
  const parts = path.split('.');
  return parts[parts.length - 1].replace(/\[\d+\]/, '');
}

/**
 * Convert template path to actual item paths
 * @param {string} templatePath - Path like "root.items[0].field"
 * @param {number} itemCount - Number of items in array
 * @returns {string[]} Array of paths for each item
 */
function expandTemplatePathToItems(templatePath, itemCount) {
  const paths = [];
  for (let i = 0; i < itemCount; i++) {
    paths.push(templatePath.replace('[0]', `[${i}]`));
  }
  return paths;
}

/**
 * Detect cross-references between fields in an array
 * @param {Array} arrayData - Array to analyze
 * @param {string} arrayPath - Path to array (e.g., "root.items")
 * @returns {Object} Reference map: { fieldPath: { values: Set, referencedBy: [] } }
 */
export function detectReferences(arrayData, arrayPath) {
  const referenceMap = {};

  if (!Array.isArray(arrayData) || arrayData.length === 0) {
    return referenceMap;
  }

  // Step 1: Build merged template of all fields
  const mergedTemplate = {};
  arrayData.forEach(item => {
    if (typeof item === 'object' && item !== null) {
      Object.keys(item).forEach(key => {
        if (mergedTemplate[key] === undefined) {
          mergedTemplate[key] = item[key];
        }
      });
    }
  });

  // Step 2: Get all field paths from template
  const templatePaths = getAllPaths(mergedTemplate, `${arrayPath}[0]`);

  // Step 3: For each field, collect all unique values across array items
  const fieldValues = {}; // { templatePath: { value: Set([itemIndices]), ... } }

  templatePaths.forEach(templatePath => {
    const values = {};

    arrayData.forEach((item, index) => {
      const actualPath = templatePath.replace('[0]', `[${index}]`);
      const value = getValueAtPath({ root: { items: arrayData } }, actualPath);

      // Only track primitive values (strings, numbers, booleans)
      if (value !== undefined && value !== null && typeof value !== 'object') {
        // Use strict equality - store value as key
        const valueKey = JSON.stringify(value);
        if (!values[valueKey]) {
          values[valueKey] = {
            value: value,
            itemIndices: new Set()
          };
        }
        values[valueKey].itemIndices.add(index);
      }
    });

    fieldValues[templatePath] = values;
  });

  // Step 4: Find cross-references
  // For each field A, check if its values appear in other fields B
  templatePaths.forEach(pathA => {
    const valuesA = fieldValues[pathA];
    const fieldNameA = getFieldName(pathA);

    Object.entries(valuesA).forEach(([valueKey, { value, itemIndices: indicesA }]) => {
      // Find other fields that contain this value
      const referencedBy = [];

      templatePaths.forEach(pathB => {
        // Skip if same field
        if (pathA === pathB) return;

        const fieldNameB = getFieldName(pathB);
        // Skip if same field name (those are handled by "Apply to All")
        if (fieldNameA === fieldNameB) return;

        const valuesB = fieldValues[pathB];

        // Check if pathB contains this value
        if (valuesB[valueKey]) {
          const indicesB = valuesB[valueKey].itemIndices;

          // Add reference for each item that has this value
          indicesB.forEach(indexB => {
            const actualPathB = pathB.replace('[0]', `[${indexB}]`);
            referencedBy.push(actualPathB);
          });
        }
      });

      // Store in reference map if there are references
      if (referencedBy.length > 0) {
        // Add entry for each item that has this value
        indicesA.forEach(indexA => {
          const actualPathA = pathA.replace('[0]', `[${indexA}]`);

          if (!referenceMap[actualPathA]) {
            referenceMap[actualPathA] = {
              value: value,
              referencedBy: []
            };
          }

          // Merge referenced paths (avoid duplicates)
          referencedBy.forEach(refPath => {
            if (!referenceMap[actualPathA].referencedBy.includes(refPath)) {
              referenceMap[actualPathA].referencedBy.push(refPath);
            }
          });
        });
      }
    });
  });

  return referenceMap;
}

/**
 * Get the field that a reference path points to
 * @param {string} refPath - Reference path (e.g., "root.items[1].links.parent_job_id")
 * @param {Object} referenceMap - Reference map from detectReferences
 * @returns {string|null} The field path being referenced, or null
 */
export function getReferencedField(refPath, referenceMap) {
  for (const [fieldPath, data] of Object.entries(referenceMap)) {
    if (data.referencedBy.includes(refPath)) {
      return fieldPath;
    }
  }
  return null;
}

/**
 * Check if a field has any references
 * @param {string} path - Field path
 * @param {Object} referenceMap - Reference map from detectReferences
 * @returns {boolean} True if field has references
 */
export function hasReferences(path, referenceMap) {
  return referenceMap[path]?.referencedBy?.length > 0;
}

/**
 * Get all fields that reference a specific field
 * @param {string} path - Field path
 * @param {Object} referenceMap - Reference map from detectReferences
 * @returns {string[]} Array of reference paths
 */
export function getReferencesFor(path, referenceMap) {
  return referenceMap[path]?.referencedBy || [];
}
