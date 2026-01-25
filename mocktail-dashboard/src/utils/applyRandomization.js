import { faker } from '@faker-js/faker';
import { fakerConfigs } from './fakerConfigs';

/**
 * Apply faker configurations to JSON data
 * @param {*} data - Original JSON data
 * @param {object} configurations - Map of path -> config
 * @param {string} basePath - Current path in traversal
 * @returns {*} Randomized data
 */
export function applyRandomization(data, configurations, basePath = 'root') {
  // Seed faker once at the start
  faker.seed(Date.now());

  return traverse(data, configurations, basePath);
}

function traverse(current, configurations, path) {
  // Primitive value
  if (typeof current !== 'object' || current === null) {
    const config = configurations[path];
    if (config && config.type && config.type !== 'Keep Original') {
      return generateFakerValue(config, current);
    }
    return current;
  }

  // Array
  if (Array.isArray(current)) {
    // Check if this is configured for array generation
    const arrayConfig = configurations[path];
    const targetLength = arrayConfig?.targetLength || current.length;
    const includedFields = arrayConfig?.includedFields;

    if (current.length === 0) return current;

    // Build merged template and field occurrence map
    const mergedTemplate = {};
    const fieldFirstOccurrence = {};
    current.forEach((item, idx) => {
      if (typeof item === 'object' && item !== null) {
        Object.keys(item).forEach(key => {
          if (mergedTemplate[key] === undefined) {
            mergedTemplate[key] = item[key];
            fieldFirstOccurrence[key] = idx;
          }
        });
      }
    });

    const result = [];
    const templatePath = `${path}[0]`;

    for (let i = 0; i < targetLength; i++) {
      // Use actual original item if it exists, otherwise use first item as template
      const sourceItem = i < current.length ? current[i] : current[0];

      // Traverse and generate NEW values for each iteration
      const item = traverseWithFreshValues(
        sourceItem,
        configurations,
        templatePath,
        includedFields,
        i,
        fieldFirstOccurrence,
        mergedTemplate
      );
      result.push(item);
    }

    return result;
  }

  // Object
  const result = {};
  Object.keys(current).forEach(key => {
    const newPath = `${path}.${key}`;
    result[key] = traverse(current[key], configurations, newPath);
  });

  return result;
}

// Separate function that generates fresh faker values on each call
function traverseWithFreshValues(current, configurations, templatePath, includedFields = null, currentIndex = 0, fieldFirstOccurrence = {}, mergedTemplate = {}) {
  // Primitive value - generate fresh
  if (typeof current !== 'object' || current === null) {
    // Get the template config
    const templateConfig = configurations[templatePath];

    if (templateConfig && templateConfig.type && templateConfig.type !== 'Keep Original') {
      // Get the field name from the template path
      const fieldName = templatePath.split('.').pop();

      // Check if this is the first occurrence of this field
      const isFirstOccurrence = fieldFirstOccurrence[fieldName] === currentIndex;

      // Always apply to the first occurrence of this field
      // For other occurrences, only apply if applyToAll is checked
      if (isFirstOccurrence || templateConfig.applyToAll === true) {
        return generateFakerValue(templateConfig, current);
      }
    }

    return current;
  }

  // Array within array
  if (Array.isArray(current)) {
    return current.map((item, idx) => {
      return traverseWithFreshValues(item, configurations, `${templatePath}[0]`, includedFields, currentIndex, fieldFirstOccurrence, {});
    });
  }

  // Object - recursively traverse
  const result = {};

  // Use merged template keys to check for fields that should be added
  const allKeys = new Set([...Object.keys(current), ...Object.keys(mergedTemplate)]);

  allKeys.forEach(key => {
    const newTemplatePath = `${templatePath}.${key}`;
    const hasConfig = configurations[newTemplatePath];
    const fieldExistsInCurrent = current.hasOwnProperty(key);

    // Check if this field has a configuration
    if (hasConfig) {
      // Get the field's first occurrence index
      const firstOccurrence = fieldFirstOccurrence[key];
      const isFirstOccurrence = firstOccurrence === currentIndex;

      // Process if: first occurrence OR applyToAll is true
      if (isFirstOccurrence || hasConfig.applyToAll === true) {
        // Use current value if exists, otherwise use merged template value
        const value = fieldExistsInCurrent ? current[key] : mergedTemplate[key];
        result[key] = traverseWithFreshValues(value, configurations, newTemplatePath, includedFields, currentIndex, fieldFirstOccurrence, {});
      } else if (fieldExistsInCurrent) {
        // Keep original if exists but not applying to all
        result[key] = current[key];
      }
      // If field doesn't exist and not applying to all, don't add it
    } else {
      // No config, just copy if exists
      if (fieldExistsInCurrent) {
        result[key] = traverseWithFreshValues(current[key], configurations, newTemplatePath, includedFields, currentIndex, fieldFirstOccurrence, {});
      }
    }
  });

  return result;
}

function generateFakerValue(config, originalValue) {
  const { type, options = {} } = config;

  if (type === 'Keep Original' || !type) {
    return originalValue;
  }

  const fakerConfig = fakerConfigs[type];
  if (!fakerConfig || !fakerConfig.method) {
    return originalValue;
  }

  try {
    const [module, method] = fakerConfig.method.split('.');

    if (!faker[module] || typeof faker[module][method] !== 'function') {
      console.error(`Faker method not found: ${fakerConfig.method}`);
      return originalValue;
    }

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
      return parseFloat(result.toFixed(precision));
    }

    if (type === 'Integer' && typeof result === 'number') {
      return Math.floor(result);
    }

    return result;
  } catch (error) {
    console.error(`Error generating faker value for ${type}:`, error);
    return originalValue;
  }
}
