import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import { validateAdminSecret } from '../utils/adminUtils';

const AdminSecretModal = ({ isOpen, onClose, onSubmit }) => {
  const { t } = useTranslation();
  const [adminSecret, setAdminSecret] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = () => {
    // Validate the admin secret
    const error = validateAdminSecret(adminSecret, t);

    if (error) {
      // If there's an error, set it and don't submit
      setValidationError(error);
      return;
    }

    // Clear any previous validation errors
    setValidationError('');

    // Submit the admin secret
    onSubmit(adminSecret);
    setAdminSecret(''); // Clear the input after submission
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Clear validation error when input changes
  const handleInputChange = (e) => {
    setAdminSecret(e.target.value);
    if (validationError) {
      setValidationError('');
    }
  };

  const footer = (
    <>
      <button
        className="modal-button modal-button-secondary"
        onClick={onClose}
      >
        {t('admin.cancel')}
      </button>
      <button
        className="modal-button modal-button-primary"
        onClick={handleSubmit}
        disabled={!adminSecret.trim()}
      >
        {t('admin.submit')}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('admin.secretTitle')}
      footer={footer}
    >
      <div className="modal-form-group">
        <label htmlFor="admin-secret">{t('admin.secretLabel')}</label>
        <input
          id="admin-secret"
          type="text"
          value={adminSecret}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={t('admin.secretPlaceholder')}
          autoFocus
          className={validationError ? 'input-error' : ''}
        />
        {validationError && (
          <div className="validation-error" style={{ color: '#F44336', fontSize: '14px', marginTop: '5px' }}>
            {validationError}
          </div>
        )}
      </div>

      <div className="developer-contacts">
        <div className="developer-contacts-title">{t('developer.contacts')}</div>
        <div>{t('developer.discord')}</div>
        <div>{t('developer.github').split(': ')[0]}: <a href="https://github.com/NikitaGordia" target="_blank" rel="noopener noreferrer" style={{ color: '#2196F3', textDecoration: 'none' }}>MykytaHordia</a></div>
        <div>{t('developer.cossacks3')}</div>
        <div>{t('developer.version', { version: import.meta.env.VITE_BUILD_TAG || 'dev' })}</div>
        <div className="contact-message">{t('admin.contactForSecret')}</div>
      </div>
    </Modal>
  );
};

export default AdminSecretModal;
