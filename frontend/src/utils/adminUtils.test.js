import { describe, it, expect, vi } from 'vitest';
import { validateAdminSecret } from './adminUtils';

describe('adminUtils', () => {
  // Mock translation function
  const t = vi.fn(key => key);

  describe('validateAdminSecret', () => {
    it('should return an error message for empty admin secret', () => {
      expect(validateAdminSecret('', t)).toBe('admin.secretMissing');
      expect(validateAdminSecret('   ', t)).toBe('admin.secretMissing');
      expect(validateAdminSecret(null, t)).toBe('admin.secretMissing');
      expect(validateAdminSecret(undefined, t)).toBe('admin.secretMissing');
    });

    it('should return an error message for admin secret without colon', () => {
      expect(validateAdminSecret('adminpassword', t)).toBe('admin.invalidFormat');
      expect(validateAdminSecret('admin password', t)).toBe('admin.invalidFormat');
    });

    it('should return an error message for admin secret with empty name', () => {
      expect(validateAdminSecret(':password', t)).toBe('admin.emptyName');
      expect(validateAdminSecret('  :password', t)).toBe('admin.emptyName');
    });

    it('should return an error message for admin secret with empty password', () => {
      expect(validateAdminSecret('admin:', t)).toBe('admin.emptyPassword');
      expect(validateAdminSecret('admin:  ', t)).toBe('admin.emptyPassword');
    });

    it('should return an empty string for valid admin secret', () => {
      expect(validateAdminSecret('admin:password', t)).toBe('');
      expect(validateAdminSecret('admin:123456', t)).toBe('');
      expect(validateAdminSecret('admin_user:complex password', t)).toBe('');
    });
  });
});
