import { useMemo } from 'react';

/**
 * Analyze array structure and detect irregularities
 * @param {Array} arrayData - Array to analyze
 * @returns {object} Analysis results
 */
export function useArrayAnalysis(arrayData) {
  return useMemo(() => {
    if (!Array.isArray(arrayData) || arrayData.length === 0) {
      return {
        isIrregular: false,
        fieldFrequency: [],
        totalItems: 0,
        hasObjects: false
      };
    }

    // Check if array contains objects
    const hasObjects = arrayData.some(
      item => typeof item === 'object' && item !== null && !Array.isArray(item)
    );

    if (!hasObjects) {
      return {
        isIrregular: false,
        fieldFrequency: [],
        totalItems: arrayData.length,
        hasObjects: false
      };
    }

    // Count field occurrences
    const fieldCounts = {};
    arrayData.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        Object.keys(item).forEach(key => {
          fieldCounts[key] = (fieldCounts[key] || 0) + 1;
        });
      }
    });

    const totalItems = arrayData.length;
    const fieldFrequency = Object.entries(fieldCounts).map(([field, count]) => {
      const percentage = (count / totalItems) * 100;
      let status = 'all';

      if (count === totalItems) {
        status = 'all';
      } else if (percentage >= 50) {
        status = 'common';
      } else {
        status = 'rare';
      }

      return {
        name: field,
        count,
        percentage,
        status
      };
    });

    // Sort by count descending
    fieldFrequency.sort((a, b) => b.count - a.count);

    // Check if irregular (not all fields present in all items)
    const isIrregular = fieldFrequency.some(f => f.status !== 'all');

    return {
      isIrregular,
      fieldFrequency,
      totalItems,
      hasObjects: true
    };
  }, [arrayData]);
}
