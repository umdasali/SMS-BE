/**
 * Converts a flat object with dot-notated keys into a nested object.
 */
export const unflatten = (data: Record<string, unknown>): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (key.includes('.')) {
      const parts = key.split('.');
      let current = result;
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!current[part]) {
          current[part] = {};
        } else if (typeof current[part] !== 'object' || current[part] === null) {
          // If the path is blocked by a non-object (like if the client sent 'address' and 'address.city'),
          // we override it with an object to allow nesting.
          current[part] = {};
        }
        current = current[part] as Record<string, unknown>;
      }
      current[parts[parts.length - 1]] = value;
    } else if (value === '[object Object]') {
      // Ignore stringified [object Object] which usually indicates a failure to flatten in the frontend
      continue;
    } else {
      result[key] = value;
    }
  }
  return result;
};
