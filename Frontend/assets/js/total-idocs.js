(function() {
    const API_URL = 'http://127.0.0.1:8000/api/monitoring/edids-data';
    const ELEMENT_ID = 'total-idocs-today';
    const POLLING_INTERVAL_MS = 15000;

    let intervalId = null;

    async function fetchAndDisplayTotalIdocs() {
        const targetElement = document.getElementById(ELEMENT_ID);

        if (!targetElement) {
            console.error(`[Total IDocs] Critical: Element with ID #${ELEMENT_ID} not found in the DOM. Stopping updates.`);
            if (intervalId) {
                clearInterval(intervalId);
            }
            return;
        }

        try {
            const response = await fetch(API_URL, { cache: 'no-store' });

            if (!response.ok) {
                throw new Error(`Network response was not OK. Status: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (!Array.isArray(data)) {
                throw new Error('API response is not an array as expected.');
            }

            const totalIdocs = data.length;
            targetElement.textContent = totalIdocs.toLocaleString();

        } catch (error) {
            console.error('[Total IDocs] Failed to fetch or process IDoc data:', error);
            targetElement.textContent = 'Error'; // Display an error state
        }
    }

    function startPolling() {
        // Clear any existing polling to avoid duplicates
        if (intervalId) {
            clearInterval(intervalId);
        }

        // Fetch immediately on start, then set up the interval
        fetchAndDisplayTotalIdocs();
        intervalId = setInterval(fetchAndDisplayTotalIdocs, POLLING_INTERVAL_MS);
    }

    window.addEventListener('load', startPolling);
    window.addEventListener('beforeunload', () => {
        if (intervalId) {
            clearInterval(intervalId);
        }
    });

})();
