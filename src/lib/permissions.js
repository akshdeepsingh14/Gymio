// Small, pure helpers for checking permissions. The staff portal reads permission lists
// from the signed-in staff session. These are a frontend demonstration only: the future
// backend must check every permission on the server, for the right gym, on every request.

export const hasPermission = (permissions, key) => Array.isArray(permissions) && permissions.includes(key);

export const hasAnyPermission = (permissions, keys) => keys.some((key) => hasPermission(permissions, key));

export const hasAllPermissions = (permissions, keys) => keys.every((key) => hasPermission(permissions, key));