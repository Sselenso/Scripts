<!DOCTYPE html>
<html>
<head>
  <base target="_top">
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
  <style>
    :root {
      --primary-color: #1a73e8;
      --primary-dark: #0d47a1;
      --primary-light: #e8f0fe;
      --primary-gradient: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
      
      --success-color: #34a853;
      --success-bg: #f0fff4;
      --error-color: #c5221f;
      --error-bg: #fce8e6;
      
      --text-primary: #5f6368;
      --text-secondary: #9aa0a6;
      --border-color: #dadce0;
      --border-light: #e8eaed;
      --bg-main: #f5f5f5;
      --bg-white: white;
      --bg-card: #f8f9fa;
      --bg-button: #f1f3f4;
      --bg-button-hover: #e8eaed;
      --bg-overlay: rgba(0,0,0,0.08);
      
      --spacing-xs: 4px;
      --spacing-sm: 6px;
      --spacing-md: 8px;
      --spacing-lg: 12px;
      --spacing-xl: 14px;
      --spacing-2xl: 16px;
      --spacing-3xl: 20px;
      
      --radius-xs: 4px;
      --radius-sm: 6px;
      --radius-md: 8px;
      --radius-lg: 10px;
      --radius-xl: 12px;
      --radius-2xl: 20px;
      --radius-round: 50%;
      
      --font-xs: 10px;
      --font-sm: 11px;
      --font-md: 12px;
      --font-lg: 13px;
      --font-xl: 14px;
      --font-2xl: 16px;
      --font-3xl: 18px;
      
      --shadow-sm: 0 1px 0 rgba(0,0,0,0.1);
      --shadow-md: 0 2px 6px rgba(0,0,0,0.08);
      --shadow-focus: 0 0 0 2px rgba(26,115,232,0.12);
      
      --transition-fast: 0.1s;
      --transition-normal: 0.15s;
    }
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      background: var(--bg-main);
      font-size: var(--font-lg);
    }
    
    .container {
      background: var(--bg-white);
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    .header {
      background: var(--primary-gradient);
      color: var(--bg-white);
      padding: var(--spacing-xl) var(--spacing-2xl);
      text-align: center;
      flex-shrink: 0;
    }
    
    .header h3 {
      font-size: var(--font-2xl);
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-md);
    }
    
    .header h3 i {
      font-size: var(--font-3xl);
    }
    
    .filters {
      padding: var(--spacing-lg);
      background: var(--bg-card);
      border-bottom: 1px solid var(--border-light);
      display: flex;
      gap: var(--spacing-lg);
      flex-wrap: wrap;
      align-items: flex-end;
      flex-shrink: 0;
    }
    
    .filter-group {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }
    
    .filter-group label {
      font-size: var(--font-xs);
      font-weight: 600;
      color: var(--text-primary);
      text-transform: uppercase;
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
    }
    
    .filter-group label i {
      font-size: var(--font-sm);
      color: var(--primary-color);
    }
    
    .filter-group input, .filter-group select {
      padding: var(--spacing-md) var(--spacing-lg);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      font-size: var(--font-lg);
      font-family: inherit;
      background: var(--bg-white);
      min-width: 150px;
    }
    
    .filter-group input:focus, .filter-group select:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: var(--shadow-focus);
    }
    
    button {
      background: var(--primary-gradient);
      color: var(--bg-white);
      border: none;
      padding: var(--spacing-md) var(--spacing-2xl);
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-size: var(--font-lg);
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      transition: var(--transition-fast);
    }
    
    button:hover {
      opacity: 0.9;
      transform: scale(0.98);
    }
    
    .stats-table-wrapper {
      flex: 1;
      overflow: auto;
      padding: var(--spacing-lg);
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: var(--font-md);
      border-radius: var(--radius-md);
      overflow: hidden;
    }
    
    th, td {
      border: 1px solid var(--border-light);
      padding: var(--spacing-md) var(--spacing-sm);
      text-align: center;
    }
    
    th {
      background: var(--bg-card);
      font-weight: 600;
      color: var(--text-primary);
      position: sticky;
      top: 0;
      background-color: var(--bg-card);
    }
    
    .date-col {
      background: var(--bg-white);
      font-weight: 500;
      position: sticky;
      left: 0;
      background-color: var(--bg-white);
    }
    
    .totals-row {
      background: var(--primary-light);
      font-weight: 600;
    }
    
    .totals-row td {
      background: var(--primary-light);
    }
    
    .grand-total {
      background: #d2e3fc;
      font-weight: 700;
    }
    
    .grand-total td {
      background: #d2e3fc;
    }
    
    .loading {
      display: none;
      text-align: center;
      font-size: var(--font-md);
      color: var(--primary-color);
      padding: var(--spacing-lg);
      background: var(--primary-light);
      border-radius: var(--radius-2xl);
      margin: var(--spacing-lg);
    }
    
    .loading.active {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-md);
    }
    
    .spinner {
      width: var(--font-2xl);
      height: var(--font-2xl);
      border: 2px solid var(--primary-color);
      border-top-color: transparent;
      border-radius: var(--radius-round);
      animation: spin 0.6s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .error-message {
      background: var(--error-bg);
      color: var(--error-color);
      padding: var(--spacing-md) var(--spacing-lg);
      border-radius: var(--radius-md);
      font-size: var(--font-md);
      margin: var(--spacing-lg);
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }
    
    .hotkey {
      text-align: center;
      font-size: var(--font-xs);
      color: var(--text-secondary);
      padding: var(--spacing-md);
      flex-shrink: 0;
      border-top: 1px solid var(--border-light);
      display: flex;
      justify-content: center;
      gap: var(--spacing-2xl);
      flex-wrap: wrap;
    }
    
    kbd {
      background: var(--border-light);
      border-radius: var(--radius-xs);
      padding: 2px 6px;
      font-family: monospace;
      font-size: 9px;
      box-shadow: var(--shadow-sm);
    }
  </style>
</head>
<body>
<div class="container">
  <div class="header">
    <h3>
      <i class="material-icons">bar_chart</i>
      Статистика обзвонов
    </h3>
  </div>
  
  <div class="filters">
    <div class="filter-group">
      <label><i class="material-icons">date_range</i> Дата от</label>
      <input type="date" id="startDate">
    </div>
    <div class="filter-group">
      <label><i class="material-icons">date_range</i> Дата до</label>
      <input type="date" id="endDate">
    </div>
    <div class="filter-group">
      <label><i class="material-icons">person</i> Менеджер</label>
      <select id="managerSelect">
        <option value="all">Все менеджеры</option>
      </select>
    </div>
    <button onclick="loadStats()"><i class="material-icons">search</i> Показать</button>
  </div>
  
  <div class="loading" id="loading">
    <div class="spinner"></div>
    <span>Загрузка данных...</span>
  </div>
  
  <div id="errorContainer"></div>
  
  <div class="stats-table-wrapper" id="tableWrapper">
    <table id="statsTable">
      <thead id="tableHead"></thead>
      <tbody id="tableBody"></tbody>
    </table>
  </div>
  
  <div class="hotkey">
    <span><kbd>Shift</kbd> + <kbd>Enter</kbd> — обновить</span>
    <span><kbd>Esc</kbd> — очистить фильтры</span>
  </div>
</div>

<script>
  let currentData = null;
  let fullManagersList = []; 
  
  function loadStats() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const manager = document.getElementById('managerSelect').value;
    
    document.getElementById('loading').classList.add('active');
    document.getElementById('errorContainer').innerHTML = '';
    
    google.script.run
      .withSuccessHandler(function(result) {
        document.getElementById('loading').classList.remove('active');
        if (result.error) {
          showError(result.error);
          return;
        }
        currentData = result;
        
       
        if (fullManagersList.length === 0 && result.managers) {
          fullManagersList = [...result.managers];          
          initManagerSelect(fullManagersList, manager);
        }
        
        renderStats(result);
      })
      .withFailureHandler(function(error) {
        document.getElementById('loading').classList.remove('active');
        showError('Ошибка: ' + error.message);
      })
      .getCallStats({ startDate: startDate, endDate: endDate, manager: manager });
  }
  
  // Инициализация select - вызывается только один раз
  function initManagerSelect(managers, selectedValue) {
    const select = document.getElementById('managerSelect');
    select.innerHTML = '<option value="all">Все менеджеры</option>';
    
    managers.forEach(m => {
      const option = document.createElement('option');
      option.value = m;
      option.textContent = m;
      if (selectedValue === m) {
        option.selected = true;
      }
      select.appendChild(option);
    });
  }
  
  function renderStats(stats) {
    const managers = stats.managers || [];
    const tableData = stats.data || [];
    const totals = stats.totals || {};
    const grandTotal = stats.grandTotal || 0;    
    
    const thead = document.getElementById('tableHead');
    thead.innerHTML = '<tr><th>Дата</th>' + managers.map(m => `<th>${escapeHtml(m)}</th>`).join('') + '<th>Итого за день</th></tr>';
    
    
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    
    for (const row of tableData) {
      const date = row.date;
      let dayTotal = 0;
      const cells = managers.map(m => {
        const val = row[m] || 0;
        dayTotal += val;
        return `<td>${val}</td>`;
      }).join('');
      tbody.innerHTML += `<tr><td class="date-col">${date}</td>${cells}<td><b>${dayTotal}</b></td></tr>`;
    }    
   
    let totalsRow = '<tr class="totals-row"><td class="date-col"><b>ИТОГО</b></td>';
    let grand = 0;
    for (const m of managers) {
      const total = totals[m] || 0;
      grand += total;
      totalsRow += `<td><b>${total}</b></td>`;
    }
    totalsRow += `<td><b>${grand}</b></td></tr>`;    
   
    tbody.innerHTML += totalsRow;
    tbody.innerHTML += `<tr class="grand-total"><td class="date-col"><b>ВСЕГО ЗА ПЕРИОД</b></td>${managers.map(() => '<td></td>').join('')}<td><b>${grandTotal}</b></td></tr>`;
  }
  
  function showError(msg) {
    const container = document.getElementById('errorContainer');
    container.innerHTML = `<div class="error-message"><i class="material-icons">error_outline</i> ${msg}</div>`;
    setTimeout(() => {
      if (container.firstChild) container.firstChild.remove();
    }, 4000);
  }
  
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
      if (m === '&') return '&amp;';
      if (m === '<') return '&lt;';
      if (m === '>') return '&gt;';
      return m;
    });
  }
  
  function clearFilters() {
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);
  document.getElementById('startDate').value = sevenDaysAgo.toISOString().split('T')[0];
  document.getElementById('endDate').value = today.toISOString().split('T')[0];
  document.getElementById('managerSelect').value = 'all';
  loadStats();
}
  
  function handleKeyDown(e) {
    if (e.shiftKey && e.key === 'Enter') {
      e.preventDefault();
      loadStats();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      clearFilters();
    }
  }
  
  document.addEventListener('keydown', handleKeyDown);  
  
 window.onload = function() {
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);
  document.getElementById('startDate').value = sevenDaysAgo.toISOString().split('T')[0];
  document.getElementById('endDate').value = today.toISOString().split('T')[0];
  loadStats();
};
</script>
</body>
</html>
