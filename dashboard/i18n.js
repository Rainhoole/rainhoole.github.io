// i18n.js

const defaultLanguage = 'en';
let currentLanguage = defaultLanguage;
let translations = {};

async function loadTranslations(lang) {
  try {
    const response = await fetch(`./${lang}.json`);
    translations = await response.json();
    currentLanguage = lang;
    updateUI();
  } catch (error) {
    console.error(`Error loading translations for ${lang}:`, error);
  }
}

function translate(key) {
  return translations[key] || key;
}

function updateUI() {
  // Implement UI update logic here
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    element.textContent = translate(key);
  });
  console.log('UI updated with translations for ' + currentLanguage);
}

async function changeLanguage(lang) {
  await loadTranslations(lang);
}

// Load default language on initialization
loadTranslations(defaultLanguage);

export { translate, changeLanguage, loadTranslations };