// Global state
let currentLanguage = 'sk';
let compatibilityData = null;

// DOM elements
const form = document.getElementById('compatibilityForm');
const yourTypeSelect = document.getElementById('yourType');
const partnerTypeSelect = document.getElementById('partnerType');
const loadingSpinner = document.getElementById('loadingSpinner');
const resultsCard = document.getElementById('resultsCard');
const scoreValue = document.getElementById('scoreValue');
const compatibilityLevel = document.getElementById('compatibilityLevel');
const resultDescription = document.getElementById('resultDescription');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeLanguage();
    initializeForm();
    initializeDescriptions();
});

// Language management
function switchLanguage(lang) {
    currentLanguage = lang;
    updateLanguageDisplay();
    updateButtonStates();
    updateSelectDescriptions();
    
    // Update URL parameter
    const url = new URL(window.location);
    url.searchParams.set('lang', lang);
    window.history.replaceState({}, '', url);
}

function initializeLanguage() {
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    if (langParam && ['sk', 'en'].includes(langParam)) {
        currentLanguage = langParam;
    }
    updateLanguageDisplay();
    updateButtonStates();
}

function updateLanguageDisplay() {
    // Hide all language elements
    document.querySelectorAll('.lang-sk, .lang-en').forEach(el => {
        el.classList.add('d-none');
    });
    
    // Show current language elements
    document.querySelectorAll(`.lang-${currentLanguage}`).forEach(el => {
        el.classList.remove('d-none');
    });
    
    // Update page title
    const title = currentLanguage === 'sk' 
        ? 'Bežecký test kompatibility'
        : 'Running Compatibility Test';
    document.title = title;
}

function updateButtonStates() {
    document.querySelectorAll('.language-toggle .btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = document.getElementById(`btn-${currentLanguage}`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
}

// Form management
function initializeForm() {
    form.addEventListener('submit', handleFormSubmit);
    yourTypeSelect.addEventListener('change', updateYourTypeDescription);
    partnerTypeSelect.addEventListener('change', updatePartnerTypeDescription);
}

function initializeDescriptions() {
    updateSelectDescriptions();
}

function updateSelectDescriptions() {
    updateYourTypeDescription();
    updatePartnerTypeDescription();
}

function updateYourTypeDescription() {
    const selected = yourTypeSelect.options[yourTypeSelect.selectedIndex];
    const desc = selected.getAttribute(`data-desc-${currentLanguage}`) || '';
    document.getElementById('yourTypeDesc').textContent = desc;
}

function updatePartnerTypeDescription() {
    const selected = partnerTypeSelect.options[partnerTypeSelect.selectedIndex];
    const desc = selected.getAttribute(`data-desc-${currentLanguage}`) || '';
    document.getElementById('partnerTypeDesc').textContent = desc;
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const yourType = yourTypeSelect.value;
    const partnerType = partnerTypeSelect.value;
    
    if (!yourType || !partnerType) {
        showError(currentLanguage === 'sk' 
            ? 'Prosím vyberte oba bežecké štýly.'
            : 'Please select both running styles.');
        return;
    }
    
    showLoading();
    
    try {
        const response = await fetch('/calculate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                your_type: yourType,
                partner_type: partnerType,
                lang: currentLanguage
            })
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        compatibilityData = data;
        showResult(data);
        
    } catch (error) {
        console.error('Error:', error);
        showError(currentLanguage === 'sk' 
            ? 'Nastala chyba pri výpočte. Skúste to znovu.'
            : 'An error occurred during calculation. Please try again.');
    } finally {
        hideLoading();
    }
}

function showLoading() {
    resultsCard.classList.add('d-none');
    loadingSpinner.classList.remove('d-none');
    
    // Disable form
    const submitBtn = document.getElementById('calculateBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm me-2" role="status"></span>
        <span class="lang-${currentLanguage}">${currentLanguage === 'sk' ? 'Vypočítavam...' : 'Calculating...'}</span>
    `;
}

function hideLoading() {
    loadingSpinner.classList.add('d-none');
    
    // Enable form
    const submitBtn = document.getElementById('calculateBtn');
    submitBtn.disabled = false;
    submitBtn.innerHTML = `
        <i class="fas fa-calculator me-2"></i>
        <span class="lang-sk ${currentLanguage === 'sk' ? '' : 'd-none'}">Vyhodnoť kompatibilitu</span>
        <span class="lang-en ${currentLanguage === 'en' ? '' : 'd-none'}">Calculate Compatibility</span>
    `;
}

function showResult(data) {
    // Animate score counting
    animateScore(data.score);
    
    // Set level badge
    compatibilityLevel.textContent = data.level;
    compatibilityLevel.className = `level-badge ${data.level_class}`;
    
    // Set description
    resultDescription.textContent = data.description;
    
    // Show results card
    resultsCard.classList.remove('d-none');
    
    // Scroll to results
    setTimeout(() => {
        resultsCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
}

function animateScore(targetScore) {
    let currentScore = 0;
    const increment = targetScore / 50; // 50 steps
    const duration = 1000; // 1 second
    const stepTime = duration / 50;
    
    const timer = setInterval(() => {
        currentScore += increment;
        if (currentScore >= targetScore) {
            currentScore = targetScore;
            clearInterval(timer);
        }
        scoreValue.textContent = Math.round(currentScore);
    }, stepTime);
}

function showError(message) {
    // Create and show toast notification
    const toastHtml = `
        <div class="toast align-items-center text-white bg-danger border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '1055';
        document.body.appendChild(toastContainer);
    }
    
    // Add toast to container
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    
    // Initialize and show toast
    const toastElement = toastContainer.lastElementChild;
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
    
    // Remove toast element after it's hidden
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

function resetForm() {
    form.reset();
    resultsCard.classList.add('d-none');
    updateSelectDescriptions();
    
    // Scroll to form
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function shareResult() {
    if (!compatibilityData) return;
    
    const yourTypeName = yourTypeSelect.options[yourTypeSelect.selectedIndex].textContent.trim();
    const partnerTypeName = partnerTypeSelect.options[partnerTypeSelect.selectedIndex].textContent.trim();
    
    const shareText = currentLanguage === 'sk' 
        ? `Náš bežecký test kompatibility: ${compatibilityData.score}% zhoda! ${yourTypeName} + ${partnerTypeName} = ${compatibilityData.level}`
        : `Our running compatibility test: ${compatibilityData.score}% match! ${yourTypeName} + ${partnerTypeName} = ${compatibilityData.level}`;
    
    if (navigator.share) {
        navigator.share({
            title: currentLanguage === 'sk' ? 'Bežecký test kompatibility' : 'Running Compatibility Test',
            text: shareText,
            url: window.location.href
        }).catch(console.error);
    } else {
        // Fallback to clipboard
        navigator.clipboard.writeText(`${shareText}\n${window.location.href}`)
            .then(() => {
                showSuccess(currentLanguage === 'sk' 
                    ? 'Výsledok bol skopírovaný do schránky!'
                    : 'Result copied to clipboard!');
            })
            .catch(() => {
                // Manual fallback
                const textArea = document.createElement('textarea');
                textArea.value = `${shareText}\n${window.location.href}`;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                
                showSuccess(currentLanguage === 'sk' 
                    ? 'Výsledok bol skopírovaný do schránky!'
                    : 'Result copied to clipboard!');
            });
    }
}

function showSuccess(message) {
    const toastHtml = `
        <div class="toast align-items-center text-white bg-success border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas fa-check-circle me-2"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '1055';
        document.body.appendChild(toastContainer);
    }
    
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    
    const toastElement = toastContainer.lastElementChild;
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
    
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

// Keyboard navigation support
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.target.matches('select')) {
        e.target.blur();
    }
});

// Add smooth scrolling for older browsers
if (!('scrollBehavior' in document.documentElement.style)) {
    const scrollToElement = (element, duration = 1000) => {
        const start = window.pageYOffset;
        const target = element.getBoundingClientRect().top + start;
        const distance = target - start;
        let startTime = null;
        
        const animation = (currentTime) => {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / duration, 1);
            
            window.scrollTo(0, start + distance * easeInOutCubic(progress));
            
            if (timeElapsed < duration) {
                requestAnimationFrame(animation);
            }
        };
        
        requestAnimationFrame(animation);
    };
    
    const easeInOutCubic = (t) => {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    };
    
    // Override scrollIntoView for older browsers
    Element.prototype.scrollIntoView = function(options = {}) {
        if (options.behavior === 'smooth') {
            scrollToElement(this);
        } else {
            // Fallback to default behavior
            const top = this.getBoundingClientRect().top + window.pageYOffset;
            window.scrollTo(0, top);
        }
    };
}
