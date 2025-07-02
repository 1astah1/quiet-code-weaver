/**
 * Utility functions for safe array operations in admin panel
 */

/**
 * Safely get array length with fallback
 */
export const safeArrayLength = (arr: unknown): number => {
  return Array.isArray(arr) ? arr.length : 0;
};

/**
 * Safely map over array with fallback
 */
export const safeArrayMap = <T, R>(
  arr: unknown,
  mapFn: (item: T, index: number) => R,
  fallback: R[] = []
): R[] => {
  if (!Array.isArray(arr)) {
    return fallback;
  }
  try {
    return arr.map(mapFn);
  } catch (error) {
    console.error('Error in safeArrayMap:', error);
    return fallback;
  }
};

/**
 * Safely filter array with fallback
 */
export const safeArrayFilter = <T>(
  arr: unknown,
  filterFn: (item: T, index: number) => boolean,
  fallback: T[] = []
): T[] => {
  if (!Array.isArray(arr)) {
    return fallback;
  }
  try {
    return arr.filter(filterFn);
  } catch (error) {
    console.error('Error in safeArrayFilter:', error);
    return fallback;
  }
};

/**
 * Safely find item in array with fallback
 */
export const safeArrayFind = <T>(
  arr: unknown,
  findFn: (item: T, index: number) => boolean,
  fallback?: T
): T | undefined => {
  if (!Array.isArray(arr)) {
    return fallback;
  }
  try {
    return arr.find(findFn) || fallback;
  } catch (error) {
    console.error('Error in safeArrayFind:', error);
    return fallback;
  }
};

/**
 * Safely access array item by index
 */
export const safeArrayAccess = <T>(
  arr: unknown,
  index: number,
  fallback?: T
): T | undefined => {
  if (!Array.isArray(arr) || index < 0 || index >= arr.length) {
    return fallback;
  }
  return arr[index] || fallback;
};

/**
 * Ensure value is array
 */
export const ensureArray = <T>(value: unknown): T[] => {
  if (Array.isArray(value)) {
    return value;
  }
  if (value === null || value === undefined) {
    return [];
  }
  return [value] as T[];
};

/**
 * Safely join array elements
 */
export const safeArrayJoin = (
  arr: unknown,
  separator: string = ', ',
  fallback: string = ''
): string => {
  if (!Array.isArray(arr)) {
    return fallback;
  }
  try {
    return arr.join(separator);
  } catch (error) {
    console.error('Error in safeArrayJoin:', error);
    return fallback;
  }
};

/**
 * Check if array has items
 */
export const hasArrayItems = (arr: unknown): boolean => {
  return Array.isArray(arr) && arr.length > 0;
};