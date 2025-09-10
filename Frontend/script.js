let previousData = {};

async function fetchData() {
  try {
    const response = await fetch('idoc_data.json?t=' + Date.now());
    const data = await response.json();
    updateTiles(data.dashboard);
    updateErrorTable(data.dashboard.error_list);
    const now = new Date().toLocaleTimeString();
    document.querySelector('.status-bar').innerHTML = `<span class="status-dot"></span> Online - Updated ${now}`;
  } catch (error) {
    document.querySelector('.status-bar').innerHTML = '<span class="status-dot offline"></span> No Data - Run Python Script';
    resetTiles();
  }
}

function updateErrorTable(errorList) {
  const tbody = document.querySelector('.error-table tbody');
  
  if (!errorList || errorList.length === 0) {
    errorList = [
      {
        idoc_no: 'IDOC_00001',
        msg_type: 'ORDERS05',
        status: 'ERROR',
        error_msg: 'Segment E1EDK01 - Field BELNR is mandatory',
        partner: 'VENDOR_001',
        timestamp: '2024-01-15 10:30:00'
      },
      {
        idoc_no: 'IDOC_00002',
        msg_type: 'DEBMAS06',
        status: 'WARNING',
        error_msg: 'Customer master data incomplete',
        partner: 'CUSTOMER_002',
        timestamp: '2024-01-15 10:25:00'
      }
    ];
  }
  
  // Store all data for filtering
  if (arguments.length === 1 && errorList !== allErrorData) {
    allErrorData = errorList;
    populateFilters(errorList);
  }
  
  tbody.innerHTML = errorList.map(error => `
    <tr>
      <td>${error.idoc_no}</td>
      <td>${error.msg_type}</td>
      <td class="${error.status.toLowerCase() === 'error' ? 'status-error' : 'status-warning'}">${error.status}</td>
      <td>${error.error_msg}</td>
      <td>${error.partner}</td>
      <td>${error.timestamp}</td>
      <td class="actions-cell">
        <span class="action-btn">👁️</span>
        <span class="action-btn">⚡</span>
        <span class="action-btn">🔄</span>
        <span class="action-btn">⚙️</span>
      </td>
    </tr>
  `).join('');
}

function updateTiles(data) {
  document.querySelector('.tile1 .count').textContent = data.total || 0;
  document.querySelector('.tile2 .count').textContent = data.errors || 0;
  document.querySelector('.tile3 .count').textContent = data.successful || 0;
  document.querySelector('.tile4 .count').textContent = data.processing || 0;
  
  const totalChange = getChange(previousData.total, data.total);
  const errorChange = getChange(previousData.errors, data.errors);
  const successChange = getChange(previousData.successful, data.successful);
  const processChange = getChange(previousData.processing, data.processing);
  
  document.querySelector('.tile1 .change').textContent = totalChange;
  document.querySelector('.tile2 .change').textContent = errorChange;
  document.querySelector('.tile3 .change').textContent = successChange;
  document.querySelector('.tile4 .change').textContent = processChange;
  
  previousData = data;
}

function resetTiles() {
  document.querySelectorAll('.count').forEach(el => el.textContent = '--');
  document.querySelectorAll('.change').forEach(el => el.textContent = '--');
}

function getChange(oldVal, newVal) {
  if (!oldVal) return '+12% from last hour';
  const change = Math.round(((newVal - oldVal) / oldVal) * 100);
  return (change >= 0 ? '+' + change : change) + '% from last hour';
}

let allErrorData = [];

function populateFilters(errorList) {
  const partners = [...new Set(errorList.map(item => item.partner))].sort();
  const msgTypes = [...new Set(errorList.map(item => item.msg_type))].sort();
  
  const partnerSelect = document.getElementById('partner-filter');
  const msgTypeSelect = document.getElementById('msgtype-filter');
  
  partnerSelect.innerHTML = '<option value="">All Partners</option>';
  msgTypeSelect.innerHTML = '<option value="">All Types</option>';
  
  partners.forEach(partner => {
    partnerSelect.innerHTML += `<option value="${partner}">${partner}</option>`;
  });
  
  msgTypes.forEach(type => {
    msgTypeSelect.innerHTML += `<option value="${type}">${type}</option>`;
  });
}

function applyFilters() {
  const partnerFilter = document.getElementById('partner-filter').value;
  const msgTypeFilter = document.getElementById('msgtype-filter').value;
  const dateFrom = document.getElementById('date-from').value;
  const dateTo = document.getElementById('date-to').value;
  
  let filtered = allErrorData;
  
  if (partnerFilter) {
    filtered = filtered.filter(item => item.partner === partnerFilter);
  }
  
  if (msgTypeFilter) {
    filtered = filtered.filter(item => item.msg_type === msgTypeFilter);
  }
  
  if (dateFrom) {
    filtered = filtered.filter(item => item.timestamp >= dateFrom);
  }
  
  if (dateTo) {
    filtered = filtered.filter(item => item.timestamp <= dateTo + ' 23:59:59');
  }
  
  updateErrorTable(filtered);
}

function clearFilters() {
  document.getElementById('partner-filter').value = '';
  document.getElementById('msgtype-filter').value = '';
  document.getElementById('date-from').value = '';
  document.getElementById('date-to').value = '';
  updateErrorTable(allErrorData);
}

fetchData();
setInterval(fetchData, 30000);