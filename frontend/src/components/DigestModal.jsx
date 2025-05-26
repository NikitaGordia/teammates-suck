import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import RankChangesChart from './digest/RankChangesChart';
import TopPlayersChart from './digest/TopPlayersChart';
import TopAdminsChart from './digest/TopAdminsChart';
import ActivityCharts from './digest/ActivityCharts';
import { API_CONFIG, getApiUrl } from '../config';
import './DigestModal.css';

const DigestModal = ({ isOpen, onClose, digestData, isLoading, error }) => {
  const { t } = useTranslation();
  const modalRef = useRef(null);

  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  const handleDownloadGames = () => {
    const downloadUrl = getApiUrl(API_CONFIG.ENDPOINTS.DIGEST_GAMES);
    window.open(downloadUrl, '_blank');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="digest-modal-overlay">
      <div className="digest-modal-container" ref={modalRef}>
        <div className="digest-modal-header">
          <h2>{t('digest.title')}</h2>
          <button className="digest-modal-close-button" onClick={onClose}>×</button>
        </div>

        <div className="digest-modal-content">
          {isLoading && (
            <div className="digest-loading">
              <div className="loading-spinner"></div>
              <p>{t('digest.loading')}</p>
            </div>
          )}

          {error && (
            <div className="digest-error">
              <p>{t('digest.error')}: {error}</p>
            </div>
          )}

          {digestData && !isLoading && !error && (
            <>
              <div className="digest-metadata">
                <p className="generated-on">
                  {t('digest.generatedOn', { date: formatDate(digestData.metadata.generated_on) })}
                </p>
                <p className="period">
                  {t('digest.period', {
                    start: digestData.metadata.period_start_date,
                    end: digestData.metadata.period_end_date
                  })}
                </p>
              </div>

              <div className="digest-sections">
                {/* Rank Changes Section */}
                {digestData.players_for_status_change && digestData.players_for_status_change.length > 0 && (
                  <section className="digest-section">
                    <h3>{t('digest.sections.rankChanges')}</h3>
                    <RankChangesChart data={digestData.players_for_status_change} />
                  </section>
                )}

                {/* Top Players Section */}
                {digestData.top_players && digestData.top_players.length > 0 && (
                  <section className="digest-section">
                    <h3>{t('digest.sections.topPlayers')}</h3>
                    <TopPlayersChart data={digestData.top_players} />
                  </section>
                )}

                {/* Top Admins Section */}
                {digestData.top_admins && digestData.top_admins.length > 0 && (
                  <section className="digest-section">
                    <h3>{t('digest.sections.topAdmins')}</h3>
                    <TopAdminsChart data={digestData.top_admins} />
                  </section>
                )}

                {/* Activity Charts Section */}
                {(digestData.hourly_activity || digestData.weekly_activity_by_day || digestData.total_activity_by_day_of_month) && (
                  <section className="digest-section">
                    <h3>{t('digest.sections.activity')}</h3>
                    <ActivityCharts
                      hourlyData={digestData.hourly_activity}
                      weeklyData={digestData.weekly_activity_by_day}
                      dailyData={digestData.total_activity_by_day_of_month}
                    />
                  </section>
                )}
              </div>

              <div className="digest-footer">
                <div className="download-info">
                  <p>{t('digest.downloadInfo')}</p>
                </div>
                <button
                  className="download-games-button"
                  onClick={handleDownloadGames}
                >
                  📊 {t('digest.downloadGames')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DigestModal;
