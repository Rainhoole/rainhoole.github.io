import { translate, changeLanguage } from './i18n.js';

// Add event listener to language select
document.getElementById('language-select').addEventListener('change', function() {
    changeLanguage(this.value);
});

function updateText() {
    // Example, need to be replaced by real elements and keys
    // document.getElementById('greeting').textContent = translate('greeting');

    document.querySelectorAll('[data-translate-key]').forEach(element => {
        element.textContent = translate(element.dataset.translateKey);
    });
}

window.updateText = updateText;

// Initial UI update
updateText();