import { fakerConfigs, fieldNameMap } from '../utils/fakerConfigs';

/**
 * Get faker configuration for a specific type
 * @param {string} type - Faker type name (e.g., 'Email', 'First Name')
 * @returns {object} Configuration object with method, icon, options
 */
export function useFakerConfig(type = null) {
  if (type) {
    return fakerConfigs[type] || null;
  }
  return fakerConfigs;
}

/**
 * Auto-detect faker type from field name
 * @param {string} fieldName - JSON field name
 * @returns {string} Detected faker type or 'Keep Original'
 */
export function useAutoDetectType(fieldName) {
  if (!fieldName) return 'Keep Original';

  const normalizedName = fieldName.toLowerCase().replace(/[^a-z0-9]/g, '');
  return fieldNameMap[normalizedName] || 'Keep Original';
}

/**
 * Get default options for a faker type
 * @param {string} type - Faker type name
 * @returns {object} Default options object
 */
export function useDefaultOptions(type) {
  const config = fakerConfigs[type];
  if (!config || !config.options) return {};

  return config.options.reduce((acc, opt) => {
    acc[opt.name] = opt.default;
    return acc;
  }, {});
}
