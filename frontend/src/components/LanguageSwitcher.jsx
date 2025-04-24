import React from 'react';
import { useTranslation } from 'react-i18next';
import { updateDocumentTitle } from '../utils/titleUpdater';
import './LanguageSwitcher.css';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    updateDocumentTitle(lng);
  };

  // Update title on component mount
  React.useEffect(() => {
    updateDocumentTitle(currentLanguage);
  }, [currentLanguage]);

  return (
    <div className="language-switcher">
      <button
        className={`language-button ${currentLanguage === 'en' ? 'active' : ''}`}
        onClick={() => changeLanguage('en')}
      >
        EN
      </button>
      <button
        className={`language-button ${currentLanguage === 'uk' ? 'active' : ''}`}
        onClick={() => changeLanguage('uk')}
      >
        UK
      </button>
    </div>
  );
};

export default LanguageSwitcher;
