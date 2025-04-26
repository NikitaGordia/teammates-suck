import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { deleteCookie, cookieExists, COOKIE_NAMES } from '../utils/cookieUtils';
import './LogoutButton.css';

const LogoutButton = () => {
  const { t } = useTranslation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check if admin secret cookie exists on mount and when it changes
  useEffect(() => {
    const checkLoginStatus = () => {
      const hasAdminSecret = cookieExists(COOKIE_NAMES.ADMIN_SECRET);
      setIsLoggedIn(hasAdminSecret);
    };

    // Check initially
    checkLoginStatus();

    // Set up an interval to check periodically (in case cookie expires)
    const intervalId = setInterval(checkLoginStatus, 5000);

    return () => clearInterval(intervalId);
  }, []);

  const handleLogout = () => {
    deleteCookie(COOKIE_NAMES.ADMIN_SECRET);
    setIsLoggedIn(false);
  };

  // Only render the button if user is logged in
  if (!isLoggedIn) {
    return null;
  }

  return (
    <button className="logout-button" onClick={handleLogout}>
      {t('admin.logout')}
    </button>
  );
};

export default LogoutButton;
