import { useState, useEffect, useMemo } from 'react';
import { faker } from '@faker-js/faker';
import { fakerConfigs } from '../utils/fakerConfigs';

/**
 * Generate preview values using faker
 * @param {object} config - Configuration object { type, options, currentValue }
 * @returns {object} { preview, regenerate, isGenerating }
 */
export function useFakerPreview(config) {
  const [preview, setPreview] = useState('');
  const [seed, setSeed] = useState(Date.now());
  const [isGenerating, setIsGenerating] = useState(false);

  // Stringify config to have stable dependency
  const configString = useMemo(() => JSON.stringify(config), [config]);

  useEffect(() => {
    if (!config || !config.type) {
      setPreview('');
      return;
    }

    // Clear preview immediately when config changes to avoid showing stale value
    setPreview('Generating...');

    // Debounce to prevent rapid regeneration
    const timer = setTimeout(() => {
      setIsGenerating(true);

      try {
        // Use seed for consistent but regeneratable results
        faker.seed(seed);

        const value = generateValue(config);
        setPreview(value);
      } catch (error) {
        console.error('Error generating preview:', error);
        setPreview('Error generating preview');
      } finally {
        setIsGenerating(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [configString, seed]);

  const regenerate = () => {
    setSeed(Date.now());
  };

  return { preview, regenerate, isGenerating };
}

/**
 * Generate a single value based on config
 * @param {object} config - { type, options, currentValue }
 * @returns {*} Generated value
 */
function generateValue(config) {
  const { type, options = {}, currentValue } = config;

  // Keep original value
  if (type === 'Keep Original' || !type) {
    return currentValue || '';
  }

  const fakerConfig = fakerConfigs[type];
  if (!fakerConfig || !fakerConfig.method) {
    return currentValue || '';
  }

  // Parse the faker method path (e.g., 'person.firstName')
  const [module, method] = fakerConfig.method.split('.');

  if (!faker[module] || typeof faker[module][method] !== 'function') {
    console.error(`Faker method not found: ${fakerConfig.method}`);
    return currentValue || '';
  }

  // Call faker with options
  try {
    let result;

    // Merge with default options from config
    const defaultOptions = fakerConfig.defaultOptions || {};
    const mergedOptions = { ...defaultOptions, ...options };

    // Special handling for different faker methods
    if (type === 'Phone Number') {
      // Generate phone using custom format since faker.phone.number() ignores formats
      const format = mergedOptions.formatType === 'Custom' && mergedOptions.customFormat
        ? mergedOptions.customFormat
        : mergedOptions.presetFormat || '!##-!##-####';

      // Replace ! with 1-9, # with 0-9
      result = format.replace(/[!#]/g, (char) => {
        if (char === '!') {
          return String(faker.number.int({ min: 1, max: 9 }));
        }
        return String(faker.number.int({ min: 0, max: 9 }));
      });
    } else if (type === 'Short Text') {
      // lorem.words() takes count as direct parameter or options object
      const count = mergedOptions.count || 5;
      result = faker[module][method](count);
    } else {
      // Most faker methods accept options object or no args
      result = Object.keys(mergedOptions).length > 0
        ? faker[module][method](mergedOptions)
        : faker[module][method]();
    }

    // Format specific types
    if ((type === 'Date' || type === 'DateTime') && result instanceof Date) {
      if (type === 'Date') {
        return result.toISOString().split('T')[0]; // YYYY-MM-DD
      }
      return result.toISOString();
    }

    if (type === 'Decimal' && typeof result === 'number') {
      const precision = options.precision !== undefined ? options.precision : 2;
      return result.toFixed(precision);
    }

    return String(result);
  } catch (error) {
    console.error(`Error calling faker.${module}.${method}:`, error);
    return currentValue || '';
  }
}

/**
 * Generate preview for an entire object
 * @param {object} data - Original data object
 * @param {object} configurations - Map of path -> config
 * @returns {object} Preview object
 */
export function useObjectPreview(data, configurations) {
  const [preview, setPreview] = useState({});
  const [seed, setSeed] = useState(Date.now());

  useEffect(() => {
    if (!data || !configurations) {
      setPreview({});
      return;
    }

    faker.seed(seed);

    const generated = generateObject(data, configurations, '');
    setPreview(generated);
  }, [data, configurations, seed]);

  const regenerate = () => {
    setSeed(Date.now());
  };

  return { preview, regenerate };
}

/**
 * Recursively generate object with faker values
 */
function generateObject(obj, configurations, basePath) {
  if (typeof obj !== 'object' || obj === null) {
    const config = configurations[basePath];
    return config ? generateValue(config) : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item, index) => {
      const itemPath = `${basePath}[${index}]`;
      return generateObject(item, configurations, itemPath);
    });
  }

  const result = {};
  Object.keys(obj).forEach(key => {
    const path = basePath ? `${basePath}.${key}` : key;
    result[key] = generateObject(obj[key], configurations, path);
  });

  return result;
}
