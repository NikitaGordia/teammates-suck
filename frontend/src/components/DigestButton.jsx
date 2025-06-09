import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import DigestModal from './DigestModal';
import { API_CONFIG, getApiUrl } from '../config';
import { handleApiResponse } from '../utils/apiUtils';
import './DigestButton.css';

const DigestButton = () => {
  const { t } = useTranslation();
  const [isDigestModalOpen, setIsDigestModalOpen] = useState(false);
  const [digestData, setDigestData] = useState(null);
  const [isDigestLoading, setIsDigestLoading] = useState(false);
  const [digestError, setDigestError] = useState(null);

  const handleDigestClick = async () => {
    setIsDigestModalOpen(true);
    setIsDigestLoading(true);
    setDigestError(null);
    setDigestData(null);

    try {
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.DIGEST));
      const data = await handleApiResponse(response);
      setDigestData(data);
    } catch (error) {
      console.error('Error fetching digest:', error);
      setDigestError(error.message);
    } finally {
      setIsDigestLoading(false);
    }
  };

  const closeDigestModal = () => {
    setIsDigestModalOpen(false);
    setDigestData(null);
    setDigestError(null);
  };

  return (
    <>
      <button
        className={`digest-button ${isDigestLoading ? 'loading' : ''}`}
        onClick={handleDigestClick}
        disabled={isDigestLoading}
      >
        {isDigestLoading ? (
          <>
            <span className="digest-spinner"></span>
            {t('digest.loading')}
          </>
        ) : (
          <>
            📊 {t('digest.title')}
          </>
        )}
      </button>

      <DigestModal
        isOpen={isDigestModalOpen}
        onClose={closeDigestModal}
        digestData={digestData}
        isLoading={isDigestLoading}
        error={digestError}
      />
    </>
  );
};

export default DigestButton;
