/**
 * Updates the document title based on the current language
 * @param {string} language - The current language code (e.g., 'en', 'uk')
 */
export const updateDocumentTitle = (language) => {
  const titles = {
    en: 'Team Balancer App',
    uk: 'Балансувальник Команд'
  };
  
  document.title = titles[language] || titles.en;
};
