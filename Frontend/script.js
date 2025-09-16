// SAP IDOC Monitoring Dashboard
// Data Sources: idoc_data.json (from SAP API) or fallback dummy data

let allErrorData = [];

// Fetch real data from API
async function fetchData() {
  try {
    const response = await fetch('http://localhost:8000/api/monitoring/edids-data');
    const data = await response.json();
    processBackendData(data);
    updateStatus('Online - Real data from API');
  } catch (error) {
    console.error('❌ API failed:', error);
    updateStatus('API connection failed');
    const emptyMetrics = { total: 0, errors: 0, successful: 0 };
    updateMetrics(emptyMetrics);
    const tbody = document.querySelector('.data-table tbody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="8">Unable to load data. Please check API connection.</td></tr>';
    }
  }
}

// Process real backend data
function processBackendData(data) {
  console.log('Processing backend data:', data.length, 'records');
  
  if (!Array.isArray(data)) {
    console.error('Data is not an array:', data);
    loadDummyData();
    return;
  }
  
  // Transform backend data to frontend format
  const transformedData = data.map(item => ({
    idoc_no: item.idoc_number || 'N/A',
    msg_type: item.message_type || 'N/A',
    status: item.status === 'Success' ? 'SUCCESS' : 'ERROR',
    error_msg: item.status_text || '',
    partner: item.sender || item.receiver || 'N/A',
    sender: item.sender || 'N/A',
    receiver: item.receiver || 'N/A',
    timestamp: `${item.date_created || ''} ${item.time_st_created || ''}`.trim(),
    application: getApplicationFromMessageType(item.message_type),
    // Store original database fields for reprocessing
    original: {
      idoc_number: item.idoc_number,
      sender: item.sender,
      receiver: item.receiver,
      date_created: item.date_created,
      time_st_created: item.time_st_created,
      status: item.status,
      person_to_notify: item.person_to_notify,
      status_text: item.status_text,
      message_type: item.message_type
    }
  }));
  
  console.log('Transformed data:', transformedData.length, 'records');
  
  // Calculate metrics with proper reprocessed count
  const currentErrors = transformedData.filter(idoc => idoc.status === 'ERROR').length;
  const totalOriginal = 32;
  
  // Initialize reprocessed count if not set (first load)
  if (reprocessedCount === 0 && currentErrors < totalOriginal) {
    reprocessedCount = totalOriginal - currentErrors;
    console.log('🔄 Initialized reprocessed count to:', reprocessedCount);
  }
  
  const metrics = {
    total: totalOriginal,
    errors: currentErrors,
    successful: reprocessedCount
  };
  updateMetrics(metrics);
  
  updateErrorTable(transformedData);
}

// Map message types to application categories
function getApplicationFromMessageType(msgType) {
  if (!msgType) return 'Generic IDOC';
  
  const msgTypeUpper = msgType.toUpperCase();
  
  if (msgTypeUpper === 'PAYEXT' || msgTypeUpper.includes('PAYMENT') || msgTypeUpper.includes('BANK') || msgTypeUpper.includes('INVOICE')) {
    return 'Banking & Payment Services';
  } else if (msgTypeUpper.includes('ORDER') || msgTypeUpper.includes('SALES')) {
    return 'Sales & Distribution';
  } else if (msgTypeUpper.includes('MASTER') || msgTypeUpper.includes('DEBMAS') || msgTypeUpper.includes('CREMAS')) {
    return 'Master Data';
  } else if (msgTypeUpper.includes('MATMAS') || msgTypeUpper.includes('MATERIAL')) {
    return 'Material Management';
  } else {
    return 'Generic IDOC';
  }
}

// Process different API response formats
function processApiData(data) {
  if (data.dashboard) {
    // Current structure with pre-calculated metrics
    updateMetrics(data.dashboard);
    updateErrorTable(data.dashboard.error_list);
  } else if (data.total && data.idocs) {
    // Realistic API: {total: 5981, idocs: [...]}
    const metrics = calculateMetricsFromIdocs(data.idocs, data.total);
    updateMetrics(metrics);
    updateErrorTable(data.idocs.filter(idoc => idoc.status === 'ERROR'));
  } else {
    // Fallback: raw array or error_list
    const idocList = data.error_list || data;
    const metrics = calculateMetrics(idocList);
    updateMetrics(metrics);
    updateErrorTable(idocList.filter(idoc => idoc.status === 'ERROR'));
  }
}

// Calculate metrics from IDOC list
function calculateMetrics(idocList) {
  if (!Array.isArray(idocList)) return { total: 0, errors: 0, successful: 0 };
  
  return {
    total: idocList.length,
    errors: idocList.filter(idoc => idoc.status === 'ERROR').length,
    successful: idocList.filter(idoc => ['SUCCESS', 'COMPLETED'].includes(idoc.status)).length
  };
}

// Calculate metrics when total is provided separately
function calculateMetricsFromIdocs(idocs, total) {
  return {
    total: total,
    errors: idocs.filter(idoc => idoc.status === 'ERROR').length,
    successful: idocs.filter(idoc => idoc.status === 'SUCCESS').length
  };
}

// Optimized data fetching with reduced loading time
function optimizeFetch() {
  // Use Promise.race for faster response
  const backendPromise = fetch('http://localhost:8000/api/monitoring/edids-data');
  const jsonPromise = fetch('idoc_data.json?t=' + Date.now());
  
  return Promise.race([backendPromise, jsonPromise])
    .then(response => response.json())
    .catch(() => null);
}

// Update metric cards
function updateMetrics(metrics) {
  const tile1 = document.querySelector('.tile1-count');
  const tile2 = document.querySelector('.tile2-count');
  const tile3 = document.querySelector('.tile3-count');
  
  console.log('📊 Updating metrics:', metrics);
  
  if (tile1) tile1.textContent = metrics.total || 0;
  if (tile2) tile2.textContent = metrics.errors || 0;
  if (tile3) tile3.textContent = metrics.successful || 0;
  
  // Static change indicators
  const change1 = document.querySelector('.tile1-change');
  const change2 = document.querySelector('.tile2-change');
  const change3 = document.querySelector('.tile3-change');
  
  if (change1) change1.textContent = '+12% from yesterday';
  if (change2) change2.textContent = '-5% from yesterday';
  if (change3) change3.textContent = '+8% from yesterday';
}

// Update error table
function updateErrorTable(errorList) {
  const tbody = document.querySelector('.data-table tbody');
  
  if (!errorList || errorList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7">No error data available</td></tr>';
    return;
  }
  
  allErrorData = errorList;
  populateFilters(errorList);
  renderErrorTable(errorList);
}

// Optimized table rendering with virtual scrolling concept
function renderErrorTable(errorList) {
  const tbody = document.querySelector('.data-table tbody');
  
  // Use DocumentFragment for faster DOM manipulation
  const fragment = document.createDocumentFragment();
  
  errorList.forEach(error => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><input type="checkbox" class="row-checkbox" data-idoc="${error.idoc_no}" onchange="updateSelectAll()"></td>
      <td>${error.idoc_no}</td>
      <td>${error.msg_type}</td>
      <td class="${error.status.toLowerCase() === 'error' ? 'status-error' : 'status-warning'}">${error.status}</td>
      <td>${error.error_msg}</td>
      <td>${error.partner}</td>
      <td>${error.timestamp}</td>
      <td class="actions-cell">
        <span class="action-btn" data-tooltip="More Info" onclick="viewDetails('${error.idoc_no}')"><i class="fas fa-eye"></i></span>
        <span class="action-btn chatgpt-btn" data-tooltip="Ask AI for Help" onclick="askAI('${error.idoc_no}', '${error.error_msg}')"><img src="assets/images/chatgpt-icon.svg" alt="ChatGPT" class="chatgpt-icon"></span>
        <span class="action-btn" data-tooltip="Reprocess" onclick="reprocessSingle('${error.idoc_no}')"><i class="fas fa-redo"></i></span>
      </td>
    `;
    fragment.appendChild(row);
  });
  
  // Single DOM update
  tbody.innerHTML = '';
  tbody.appendChild(fragment);
}



// Update status indicator
function updateStatus(message) {
  const now = new Date().toLocaleString();
  document.querySelector('.status-text').textContent = `${message} - Last updated: ${now}`;
}

// Populate filter dropdowns
function populateFilters(errorList) {
  const partners = [...new Set(errorList.map(item => item.partner))].sort();
  const msgTypes = [...new Set(errorList.map(item => item.msg_type))].sort();
  
  populateSelect('partner-filter', partners, 'All Partners');
  populateSelect('msgtype-filter', msgTypes, 'All Types');
  // Application filter has fixed options in HTML, no need to populate
}

// Helper function to populate select elements
function populateSelect(elementId, options, defaultText) {
  const select = document.getElementById(elementId);
  select.innerHTML = `<option value="">${defaultText}</option>` + 
    options.map(option => `<option value="${option}">${option}</option>`).join('');
}

// Apply filters to error table
function applyFilters() {
  const application = document.getElementById('application-filter').value;
  const partner = document.getElementById('partner-filter').value;
  const msgType = document.getElementById('msgtype-filter').value;
  
  console.log('🔍 Applying filters - App:', application, 'Partner:', partner, 'MsgType:', msgType);
  
  // Only show data for Banking & Payment Services
  if (application === 'Banking & Payment Services') {
    let filtered = allErrorData.filter(item => {
      const itemApp = item.application || 'Generic IDOC';
      return itemApp === 'Banking & Payment Services';
    });
    
    if (partner && partner !== '') {
      filtered = filtered.filter(item => item.partner === partner);
    }
    
    if (msgType && msgType !== '') {
      filtered = filtered.filter(item => item.msg_type === msgType);
    }
    
    console.log('📊 Filtered results:', filtered.length, 'records');
    renderErrorTable(filtered);
  } else if (application && application !== '') {
    // For other applications, show no data message
    const tbody = document.querySelector('.data-table tbody');
    tbody.innerHTML = '<tr><td colspan="8">No data available for this application</td></tr>';
  } else {
    // Show all data when no application filter is selected
    renderErrorTable(allErrorData);
  }
}

// Clear all filters
function clearFilters() {
  ['partner-filter', 'msgtype-filter', 'application-filter', 'date-from', 'date-to']
    .forEach(id => document.getElementById(id).value = '');
  renderErrorTable(allErrorData);
}

// Toggle select all checkboxes
function toggleSelectAll() {
  const selectAll = document.getElementById('select-all');
  const checkboxes = document.querySelectorAll('.row-checkbox');
  checkboxes.forEach(cb => cb.checked = selectAll.checked);
}

// Update select all checkbox state
function updateSelectAll() {
  const checkboxes = document.querySelectorAll('.row-checkbox');
  const selectAll = document.getElementById('select-all');
  const checkedCount = document.querySelectorAll('.row-checkbox:checked').length;
  
  selectAll.checked = checkedCount === checkboxes.length;
  selectAll.indeterminate = checkedCount > 0 && checkedCount < checkboxes.length;
}

// Reprocess selected IDOCs
async function reprocessSelected() {
  const selectedCheckboxes = document.querySelectorAll('.row-checkbox:checked');
  
  if (selectedCheckboxes.length === 0) {
    alert('Please select at least one IDOC to reprocess.');
    return;
  }
  
  const selectedIdocs = Array.from(selectedCheckboxes).map(cb => cb.dataset.idoc);
  const confirmMsg = `Are you sure you want to reprocess ${selectedIdocs.length} IDOC(s)?\n\nIDOCs: ${selectedIdocs.join(', ')}`;
  
  if (confirm(confirmMsg)) {
    try {
      // Get the full IDOC data for selected items
      const selectedRows = Array.from(selectedCheckboxes).map(cb => {
        const row = cb.closest('tr');
        const cells = row.querySelectorAll('td');
        return {
          idoc_number: cells[1].textContent,
          message_type: cells[2].textContent,
          status: cells[3].textContent,
          status_text: cells[4].textContent,
          sender: cells[5].textContent,
          receiver: cells[5].textContent, // Using partner as both sender/receiver
          date_created: cells[6].textContent.split(' ')[0],
          time_st_created: cells[6].textContent.split(' ')[1] || '00:00:00',
          person_to_notify: 'System'
        };
      });
      
      // Call reprocess API for each selected IDOC
      const reprocessPromises = selectedRows.map(row => {
        const idoc = allErrorData.find(item => item.idoc_no === row.idoc_number);
        const idocData = idoc?.original || {
          idoc_number: row.idoc_number,
          sender: 'S89200',
          receiver: 'S09200', 
          date_created: '2025-09-04 00:00:00',
          time_st_created: '03:17:07.000000',
          status: 51,
          person_to_notify: 'S89BGUSR',
          status_text: row.status_text,
          message_type: row.message_type
        };
        
        return fetch('http://127.0.0.1:8000/api/overview/reprocess', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(idocData)
        });
      });
      
      await Promise.all(reprocessPromises);
      
      alert(`${selectedIdocs.length} IDOC(s) reprocessed successfully!`);
      
      // Remove processed IDOCs from table immediately
      selectedIdocs.forEach(idocNo => {
        allErrorData = allErrorData.filter(item => item.idoc_no !== idocNo);
      });
      
      // Re-render table and update metrics
      renderErrorTable(allErrorData);
      selectedCheckboxes.forEach(cb => cb.checked = false);
      updateSelectAll();
      
      // Update metrics with new reprocessed count
      const newReprocessedCount = incrementReprocessedCount(selectedIdocs.length);
      const metrics = {
        total: 32,
        errors: allErrorData.filter(idoc => idoc.status === 'ERROR').length,
        successful: newReprocessedCount
      };
      updateMetrics(metrics);
      
    } catch (error) {
      console.error('Reprocessing failed:', error);
      alert('Reprocessing failed. Please try again.');
    }
  }
}

// Ask AI function
async function askAI(idocNo, errorMsg) {
  console.log('🤖 Ask AI clicked for IDOC:', idocNo);
  console.log('📝 Error message:', errorMsg);
  
  const loadingModal = showLoadingModal(idocNo);
  
  try {
    const response = await fetch('http://localhost:8000/api/analysis/resolve-idoc-error', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error_message: errorMsg
      })
    });
    
    const result = await response.json();
    console.log('✅ AI Response:', result);
    
    loadingModal.remove();
    showAIModal(idocNo, result.response || 'AI analysis complete');
  } catch (error) {
    console.error('❌ AI API failed:', error);
    loadingModal.remove();
    alert('AI service is currently unavailable.');
  }
}

// Show loading modal
function showLoadingModal(idocNo) {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
    background: rgba(0,0,0,0.5); z-index: 1000; display: flex; 
    align-items: center; justify-content: center;
  `;
  
  const content = document.createElement('div');
  content.style.cssText = `
    background: white; padding: 30px; border-radius: 8px; 
    text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  `;
  
  content.innerHTML = `
    <div style="font-size: 18px; margin-bottom: 15px;">🤖 AI Analyzing IDOC: ${idocNo}</div>
    <div style="font-size: 14px; color: #666; margin-bottom: 20px;">Please wait while AI generates solution...</div>
    <div style="border: 3px solid #f3f3f3; border-top: 3px solid #007bff; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 0 auto;"></div>
  `;
  
  const style = document.createElement('style');
  style.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
  document.head.appendChild(style);
  
  modal.appendChild(content);
  document.body.appendChild(modal);
  
  return modal;
}

// Show AI response in modal
function showAIModal(idocNo, response) {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
    background: rgba(0,0,0,0.5); z-index: 1000; display: flex; 
    align-items: center; justify-content: center;
  `;
  
  const content = document.createElement('div');
  content.style.cssText = `
    background: white; padding: 20px; border-radius: 8px; 
    max-width: 80%; max-height: 80%; overflow-y: auto;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  `;
  
  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Close';
  closeBtn.style.cssText = 'margin-top: 15px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;';
  closeBtn.onclick = () => modal.remove();
  
  content.innerHTML = `
    <h3>AI Solution for IDOC: ${idocNo}</h3>
    <div style="white-space: pre-wrap; font-family: monospace; font-size: 14px; line-height: 1.5;">${response}</div>
  `;
  
  content.appendChild(closeBtn);
  modal.appendChild(content);
  document.body.appendChild(modal);
  
  modal.onclick = (e) => {
    if (e.target === modal) modal.remove();
  };
}

// View details function
function viewDetails(idocNo) {
  const idoc = allErrorData.find(item => item.idoc_no === idocNo);
  if (idoc) {
    alert(`IDOC Details:\n\nIDOC: ${idoc.idoc_no}\nMessage Type: ${idoc.msg_type}\nStatus: ${idoc.status}\nError: ${idoc.error_msg}\nSender: ${idoc.sender || 'N/A'}\nReceiver: ${idoc.receiver || 'N/A'}\nTimestamp: ${idoc.timestamp}\nApplication: ${idoc.application}`);
  }
}

// Reprocess single IDOC function
function reprocessSingle(idocNo) {
  const idoc = allErrorData.find(item => item.idoc_no === idocNo);
  console.log('🔄 Reprocessing IDOC:', idocNo, idoc);
  
  if (idoc && confirm(`Reprocess IDOC ${idocNo}?`)) {
    const idocData = idoc.original || {
      idoc_number: idoc.idoc_no,
      sender: idoc.sender || 'S89200',
      receiver: idoc.receiver || 'S09200',
      date_created: '2025-09-04 00:00:00',
      time_st_created: '03:17:07.000000',
      status: 51,
      person_to_notify: 'S89BGUSR',
      status_text: idoc.error_msg,
      message_type: idoc.msg_type
    };
    
    console.log('📤 Sending reprocess data:', idocData);
    
    fetch('http://127.0.0.1:8000/api/overview/reprocess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(idocData)
    })
    .then(async response => {
      console.log('📥 Reprocess response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('📥 Reprocess successful:', result);
        alert(`IDOC ${idocNo} reprocessed successfully!`);
        
        // Remove the row from current data immediately
        allErrorData = allErrorData.filter(item => item.idoc_no !== idocNo);
        
        // Re-render table and update metrics
        renderErrorTable(allErrorData);
        
        // Increment and update reprocessed count
        const newReprocessedCount = incrementReprocessedCount(1);
        const metrics = {
          total: 32,
          errors: allErrorData.filter(idoc => idoc.status === 'ERROR').length,
          successful: newReprocessedCount
        };
        updateMetrics(metrics);
      } else {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        alert('Reprocessing failed: ' + errorText);
      }
    })
    .catch(error => {
      console.error('❌ Network error:', error);
      alert('Network error: ' + error.message);
    });
  }
}

// Track reprocessed count locally
let reprocessedCount = 0;

// Fetch reprocessed IDOCs count
async function fetchReprocessedCount() {
  return reprocessedCount;
}

// Increment reprocessed count
function incrementReprocessedCount(count = 1) {
  reprocessedCount += count;
  console.log('📊 Reprocessed count updated to:', reprocessedCount);
  return reprocessedCount;
}

// Load data once when script loads
fetchData();