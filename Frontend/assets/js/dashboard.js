$(document).ready(function() {
    // Function to fetch and update the total IDocs count for the overview page
    const fetchTotalIdocs = async () => {
        const el = $('#total-idocs-today');
        if (el.length === 0) return;

        try {
            const response = await fetch('http://127.0.0.1:8000/api/monitoring/edids-data', { cache: 'no-store' });
            if (!response.ok) {
                el.text('Error');
                return;
            }
            const data = await response.json();
            if (Array.isArray(data)) {
                el.text(data.length.toLocaleString());
            } else {
                el.text('N/A');
            }
        } catch (error) {
            console.error("Failed to fetch total IDocs:", error);
            el.text('Error');
        }
    };

    // Function to fetch and update the top errors table for the overview page
    const fetchTopErrors = async () => {
        const tbody = $('#top-errors-tbody');
        if (tbody.length === 0) return;

        try {
            const response = await fetch('http://127.0.0.1:8000/api/monitoring/edids-data', { cache: 'no-store' });
            if (!response.ok) {
                tbody.html('<tr><td colspan="2">Error loading data</td></tr>');
                return;
            }
            const data = await response.json();
            if (!Array.isArray(data)) {
                tbody.html('<tr><td colspan="2">Invalid data format</td></tr>');
                return;
            }

            const errorCounts = data.reduce((acc, item) => {
                if (item.status_text) {
                    acc[item.status_text] = (acc[item.status_text] || 0) + 1;
                }
                return acc;
            }, {});

            const sortedErrors = Object.entries(errorCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5);

            tbody.empty(); // Clear existing rows
            if (sortedErrors.length > 0) {
                sortedErrors.forEach(([error, count]) => {
                    tbody.append(`<tr><td>${error}</td><td>${count}</td></tr>`);
                });
            } else {
                tbody.append('<tr><td colspan="2">No errors to display</td></tr>');
            }

        } catch (error) {
            console.error("Failed to fetch top errors:", error);
            tbody.html('<tr><td colspan="2">Error loading data</td></tr>');
        }
    };

    // --- Logic for Partner Drilldown Page ---
    function initializePartnerDrilldown() {
        const API_URL = 'http://127.0.0.1:8000/api/monitoring/edids-data';
        let allIdocData = [];

        // DOM Elements
        const partnerSelect = document.getElementById('partner-select');
        const msgTypeSelect = document.getElementById('msg-type-select');
        const dateRangeSelect = document.getElementById('date-range-select');
        const healthScoreValue = document.getElementById('health-score-value');
        const totalIdocsEl = document.getElementById('total-idocs');
        const successRateValue = document.getElementById('success-rate-value');
        const failedIdocsValue = document.getElementById('failed-idocs-value');
        const errorTypesList = document.getElementById('error-types');
        
        async function fetchData() {
            try {
                const response = await fetch(API_URL, { cache: 'no-store' });
                if (!response.ok) throw new Error(`Failed to fetch data: ${response.statusText}`);
                allIdocData = await response.json();
                populateFilters();
                addEventListeners();
                updateDashboard();
            } catch (error) {
                console.error("Initialization failed:", error);
                if(errorTypesList) errorTypesList.innerHTML = "Failed to load data.";
            }
        }

        function populateFilters() {
            const partners = [...new Set(allIdocData.map(item => item.sender).concat(allIdocData.map(item => item.receiver)))].filter(Boolean);
            const msgTypes = [...new Set(allIdocData.map(item => item.message_type))].filter(Boolean);

            if(partnerSelect) {
                partnerSelect.innerHTML = '<option value="all">All Partners</option>';
                partners.forEach(p => partnerSelect.innerHTML += `<option value="${p}">${p}</option>`);
            }

            if(msgTypeSelect) {
                msgTypeSelect.innerHTML = '<option value="all">All Message Types</option>';
                msgTypes.forEach(m => msgTypeSelect.innerHTML += `<option value="${m}">${m}</option>`);
            }
        }

        function addEventListeners() {
            if(partnerSelect) partnerSelect.addEventListener('change', updateDashboard);
            if(msgTypeSelect) msgTypeSelect.addEventListener('change', updateDashboard);
            if(dateRangeSelect) dateRangeSelect.addEventListener('change', updateDashboard);
        }

        function updateDashboard() {
            const selectedPartner = partnerSelect.value;
            const selectedMsgType = msgTypeSelect.value;

            const filteredData = allIdocData.filter(item => {
                const partnerMatch = selectedPartner === 'all' || item.sender === selectedPartner || item.receiver === selectedPartner;
                const msgTypeMatch = selectedMsgType === 'all' || item.message_type === selectedMsgType;
                return partnerMatch && msgTypeMatch;
            });

            const totalIdocs = filteredData.length;
            const successfulIdocs = filteredData.filter(item => item.status === 53).length;
            const failedIdocs = totalIdocs - successfulIdocs;
            const successRate = totalIdocs > 0 ? (successfulIdocs / totalIdocs) * 100 : 0;
            const healthScore = Math.round(successRate);

            const errorCounts = filteredData
                .filter(item => item.status !== 53 && item.status_text)
                .reduce((acc, item) => {
                    acc[item.status_text] = (acc[item.status_text] || 0) + 1;
                    return acc;
                }, {});
            
            const totalErrors = Object.values(errorCounts).reduce((sum, count) => sum + count, 0);

            const sortedErrors = Object.entries(errorCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5);

            // The following lines are commented out to keep the metric cards static as requested.
            // if(healthScoreValue) healthScoreValue.textContent = `${healthScore}%`;
            // if(totalIdocsEl) totalIdocsEl.textContent = `${totalIdocs.toLocaleString()} Total IDocs`;
            // if(successRateValue) successRateValue.textContent = `${successRate.toFixed(1)}%`;
            // if(failedIdocsValue) failedIdocsValue.textContent = failedIdocs.toLocaleString();
            
            if(errorTypesList) {
                errorTypesList.innerHTML = ''; // Clear previous content
                if (sortedErrors.length > 0) {
                    const ol = document.createElement('ol');
                    ol.style.paddingLeft = '16px';
                    sortedErrors.forEach(([error, count]) => {
                        const percentage = totalErrors > 0 ? ((count / totalErrors) * 100).toFixed(0) : 0;
                        const li = document.createElement('li');
                        li.textContent = `${error} - ${percentage}%`;
                        ol.appendChild(li);
                    });
                    errorTypesList.appendChild(ol);
                } else {
                    errorTypesList.innerHTML = '<p style="padding-left:16px;">No errors to display for this selection.</p>';
                }
            }
        }

        fetchData();
    }

    // Use a MutationObserver to detect when new content is loaded into the main area
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
        const observer = new MutationObserver((mutationsList, observer) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Check if Overview page content is loaded
                    const overviewLoaded = mainContent.querySelector('#total-idocs-today') && mainContent.querySelector('#top-errors-tbody');
                    if (overviewLoaded && !mainContent.dataset.overviewInitialized) {
                        mainContent.dataset.overviewInitialized = 'true';
                        console.log('Overview content detected. Initializing dynamic updates.');
                        fetchTotalIdocs();
                        fetchTopErrors();
                    } else if (!overviewLoaded) {
                        delete mainContent.dataset.overviewInitialized;
                    }

                    // Check if Partner Drilldown page content is loaded
                    const partnerDrilldownLoaded = mainContent.querySelector('#partner-select') && mainContent.querySelector('#error-types');
                    if (partnerDrilldownLoaded && !mainContent.dataset.partnerDrilldownInitialized) {
                        mainContent.dataset.partnerDrilldownInitialized = 'true';
                        console.log('Partner Drilldown content detected. Initializing dynamic updates.');
                        initializePartnerDrilldown();
                    } else if (!partnerDrilldownLoaded) {
                        delete mainContent.dataset.partnerDrilldownInitialized;
                    }
                }
            }
        });
        observer.observe(mainContent, { childList: true, subtree: true });
    }
});
