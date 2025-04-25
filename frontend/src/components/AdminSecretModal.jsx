import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';

const AdminSecretModal = ({ isOpen, onClose, onSubmit }) => {
  const { t } = useTranslation();
  const [adminSecret, setAdminSecret] = useState('');

  const handleSubmit = () => {
    if (adminSecret.trim()) {
      onSubmit(adminSecret);
      setAdminSecret(''); // Clear the input after submission
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
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
          onChange={(e) => setAdminSecret(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('admin.secretPlaceholder')}
          autoFocus
        />
      </div>
      
      <div className="developer-contacts">
        <div className="developer-contacts-title">{t('developer.contacts')}</div>
        <div>{t('developer.discord')}</div>
        <div>{t('developer.github').split(': ')[0]}: <a href="https://github.com/NikitaGordia" target="_blank" rel="noopener noreferrer" style={{ color: '#2196F3', textDecoration: 'none' }}>MykytaHordia</a></div>
        <div>{t('developer.cossacks3')}</div>
        <div className="contact-message">{t('admin.contactForSecret')}</div>
      </div>
    </Modal>
  );
};

export default AdminSecretModal;
