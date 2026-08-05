const SENSITIVE_USER_FIELDS = ['password', 'passwordHash'] as const;

function stripSensitiveUserFields<T>(value: T, visited = new WeakSet<object>()): T {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => stripSensitiveUserFields(item, visited)) as T;
  }

  if (typeof value !== 'object') {
    return value;
  }

  if (value instanceof Date) {
    return value;
  }

  if (visited.has(value)) {
    return value;
  }

  visited.add(value);

  const sanitized = { ...value } as Record<string, unknown>;

  for (const field of SENSITIVE_USER_FIELDS) {
    delete sanitized[field];
  }

  for (const key of Object.keys(sanitized)) {
    sanitized[key] = stripSensitiveUserFields(sanitized[key], visited);
  }

  return sanitized as T;
}

export { stripSensitiveUserFields };
