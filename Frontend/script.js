// SAP IDOC Monitoring Dashboard
// Data Sources: idoc_data.json (from SAP API) or fallback dummy data

let allErrorData = [];

// Main data fetching function
async function fetchData() {
  try {
    const response = await fetch('idoc_data.json?t=' + Date.now());
    const data = await response.json();
    
    processApiData(data);
    updateStatus('Online - Data loaded from API');
    
  } catch (error) {
    loadDummyData();
    updateStatus('Offline - Using sample data');
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

// Update metric cards
function updateMetrics(metrics) {
  document.querySelector('.tile1-count').textContent = metrics.total || 0;
  document.querySelector('.tile2-count').textContent = metrics.errors || 0;
  document.querySelector('.tile3-count').textContent = metrics.successful || 0;
  
  // Static change indicators
  document.querySelector('.tile1-change').textContent = '+12% from yesterday';
  document.querySelector('.tile2-change').textContent = '-5% from yesterday';
  document.querySelector('.tile3-change').textContent = '+8% from yesterday';
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

// Render error table rows
function renderErrorTable(errorList) {
  const tbody = document.querySelector('.data-table tbody');
  tbody.innerHTML = errorList.map(error => `
    <tr>
      <td>${error.idoc_no}</td>
      <td>${error.msg_type}</td>
      <td class="${error.status.toLowerCase() === 'error' ? 'status-error' : 'status-warning'}">${error.status}</td>
      <td>${error.error_msg}</td>
      <td>${error.partner}</td>
      <td>${error.timestamp}</td>
      <td class="actions-cell">
        <span class="action-btn" data-tooltip="More Info"><i class="fas fa-eye"></i></span>
        <span class="action-btn chatgpt-btn" data-tooltip="Ask AI for Help"><img src="assets/images/chatgpt-icon.svg" alt="ChatGPT" class="chatgpt-icon"></span>
        <span class="action-btn" data-tooltip="Reprocessing"><i class="fas fa-redo"></i></span>
      </td>
    </tr>
  `).join('');
}

// Load dummy data for demo
function loadDummyData() {
  const dummyIdocs = [
    {
      idoc_no: 'IDOC_001', msg_type: 'ORDERS05', status: 'ERROR',
      error_msg: 'Segment E1EDK01 - Field BELNR is mandatory',
      partner: 'VENDOR_001', timestamp: '2024-01-15 10:30:00'
    },
    {
      idoc_no: 'IDOC_002', msg_type: 'DEBMAS06', status: 'ERROR',
      error_msg: 'Customer master data incomplete',
      partner: 'CUSTOMER_002', timestamp: '2024-01-15 10:25:00'
    },
    {
      idoc_no: 'IDOC_003', msg_type: 'ORDERS05', status: 'SUCCESS',
      error_msg: '', partner: 'VENDOR_001', timestamp: '2024-01-15 10:20:00'
    }
  ];
  
  const metrics = calculateMetrics(dummyIdocs);
  updateMetrics(metrics);
  updateErrorTable(dummyIdocs.filter(idoc => idoc.status === 'ERROR'));
}

// Update status indicator
function updateStatus(message) {
  document.querySelector('.status-text').textContent = message;
}

// Populate filter dropdowns
function populateFilters(errorList) {
  const partners = [...new Set(errorList.map(item => item.partner))].sort();
  const msgTypes = [...new Set(errorList.map(item => item.msg_type))].sort();
  
  populateSelect('partner-filter', partners, 'All Partners');
  populateSelect('msgtype-filter', msgTypes, 'All Types');
}

// Helper function to populate select elements
function populateSelect(elementId, options, defaultText) {
  const select = document.getElementById(elementId);
  select.innerHTML = `<option value="">${defaultText}</option>` + 
    options.map(option => `<option value="${option}">${option}</option>`).join('');
}

// Apply filters to error table
function applyFilters() {
  const filters = {
    partner: document.getElementById('partner-filter').value,
    msgType: document.getElementById('msgtype-filter').value,
    dateFrom: document.getElementById('date-from').value,
    dateTo: document.getElementById('date-to').value
  };
  
  let filtered = allErrorData.filter(item => {
    return (!filters.partner || item.partner === filters.partner) &&
           (!filters.msgType || item.msg_type === filters.msgType) &&
           (!filters.dateFrom || item.timestamp >= filters.dateFrom) &&
           (!filters.dateTo || item.timestamp <= filters.dateTo + ' 23:59:59');
  });
  
  renderErrorTable(filtered);
}

// Clear all filters
function clearFilters() {
  ['partner-filter', 'msgtype-filter', 'date-from', 'date-to']
    .forEach(id => document.getElementById(id).value = '');
  renderErrorTable(allErrorData);
}

// Initialize dashboard
fetchData();
setInterval(fetchData, 30000); // Auto-refresh every 30 seconds