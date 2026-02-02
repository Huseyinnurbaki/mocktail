import { useMemo } from 'react';
import {
  detectReferences,
  getReferencedField,
  hasReferences,
  getReferencesFor
} from '../utils/referenceDetection';

/**
 * Analyze array for cross-references between fields
 * @param {Array} arrayData - Array to analyze
 * @param {string} arrayPath - Path to array (e.g., "root.items")
 * @returns {Object} Reference analysis results and helper functions
 */
export function useReferenceAnalysis(arrayData, arrayPath) {
  return useMemo(() => {
    // Run detection
    const referenceMap = detectReferences(arrayData, arrayPath);

    return {
      // The complete reference map
      referenceMap,

      // Helper function: Get all fields that reference this field
      getReferencesFor: (path) => getReferencesFor(path, referenceMap),

      // Helper function: Get the field that this path references
      getReferencedField: (path) => getReferencedField(path, referenceMap),

      // Helper function: Check if this field has any references
      hasReferences: (path) => hasReferences(path, referenceMap),

      // Get count of references for a field
      getReferenceCount: (path) => getReferencesFor(path, referenceMap).length,

      // Check if a path is a reference to another field
      isReference: (path) => getReferencedField(path, referenceMap) !== null
    };
  }, [arrayData, arrayPath]);
}
