/**
 * Utility functions for admin-related operations
 */

/**
 * Validates an admin secret string
 * 
 * @param {string} adminSecret - The admin secret to validate in format "admin:password"
 * @param {Function} t - Translation function from i18next
 * @returns {string} - Empty string if valid, error message if invalid
 */
export const validateAdminSecret = (adminSecret, t) => {
  // Check if the secret is empty
  if (!adminSecret || !adminSecret.trim()) {
    return t('admin.secretMissing');
  }

  // Check if the secret contains a colon
  if (!adminSecret.includes(':')) {
    return t('admin.invalidFormat');
  }

  // Split the secret into name and password
  const [name, password] = adminSecret.split(':', 2);

  // Check if the name is empty
  if (!name.trim()) {
    return t('admin.emptyName');
  }

  // Check if the password is empty
  if (!password.trim()) {
    return t('admin.emptyPassword');
  }

  // If all checks pass, return empty string (no error)
  return '';
};
