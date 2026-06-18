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
      --radius-2xl: 16px;
      --radius-3xl: 20px;
      
      --font-xs: 10px;
      --font-sm: 11px;
      --font-md: 12px;
      --font-lg: 13px;
      --font-xl: 14px;
      --font-2xl: 16px;
      --font-3xl: 18px;
      --font-4xl: 24px;
      
      --shadow-sm: 0 1px 0 rgba(0,0,0,0.1);
      --shadow-md: 0 2px 6px rgba(0,0,0,0.08);
      --shadow-card: 0 2px 8px rgba(0,0,0,0.05);
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
      min-width: 140px;
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
    
    .cards-wrapper {
      flex: 1;
      overflow-y: auto;
      padding: var(--spacing-lg);
    }
    
    /* Карточка дня */
    .day-card {
      background: var(--bg-white);
      border-radius: var(--radius-lg);
      margin-bottom: var(--spacing-lg);
      box-shadow: var(--shadow-card);
      border: 1px solid var(--border-light);
      overflow: hidden;
    }
    
    .day-header {
      background: var(--bg-card);
      padding: var(--spacing-lg) var(--spacing-2xl);
      border-bottom: 1px solid var(--border-light);
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      transition: background var(--transition-fast);
    }
    
    .day-header:hover {
      background: var(--primary-light);
    }
    
    .day-date {
      font-weight: 600;
      font-size: var(--font-xl);
      color: var(--primary-color);
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }
    
    .day-date i {
      font-size: var(--font-3xl);
    }
    
    .day-total {
      background: var(--primary-light);
      padding: var(--spacing-xs) var(--spacing-lg);
      border-radius: var(--radius-3xl);
      font-weight: 600;
      font-size: var(--font-md);
      color: var(--primary-color);
    }
    
    .day-stats {
      padding: var(--spacing-lg);
    }
    
    .manager-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-md) var(--spacing-sm);
      border-bottom: 1px solid var(--border-light);
    }
    
    .manager-row:last-child {
      border-bottom: none;
    }
    
    .manager-name {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      font-weight: 500;
      color: var(--text-dark);
    }
    
    .manager-name i {
      color: var(--primary-color);
      font-size: var(--font-3xl);
    }
    
    .manager-count {
      font-weight: 700;
      font-size: var(--font-xl);
      color: var(--primary-color);
      background: var(--primary-light);
      padding: var(--spacing-xs) var(--spacing-lg);
      border-radius: var(--radius-3xl);
      min-width: 70px;
      text-align: center;
    }
    
    /* Итоговая карточка */
    .total-card {
      background: var(--primary-gradient);
      color: var(--bg-white);
      border-radius: var(--radius-lg);
      padding: var(--spacing-2xl);
      margin-top: var(--spacing-lg);
      text-align: center;
    }
    
    .total-title {
      font-size: var(--font-sm);
      opacity: 0.9;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .total-value {
      font-size: var(--font-4xl);
      font-weight: 700;
      margin: var(--spacing-sm) 0;
    }
    
    .total-breakdown {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-lg);
      justify-content: center;
      margin-top: var(--spacing-lg);
      padding-top: var(--spacing-lg);
      border-top: 1px solid rgba(255,255,255,0.2);
    }
    
    .total-manager {
      font-size: var(--font-md);
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
      border-radius: 50%;
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
    
    .empty-state {
      text-align: center;
      padding: var(--spacing-3xl);
      color: var(--text-secondary);
    }
    
    .empty-state i {
      font-size: 48px;
      margin-bottom: var(--spacing-lg);
      opacity: 0.5;
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
  
  <div class="cards-wrapper" id="cardsWrapper">
    <!-- Карточки будут здесь -->
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
    document.getElementById('cardsWrapper').innerHTML = '';
    
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
        
        renderCards(result);
      })
      .withFailureHandler(function(error) {
        document.getElementById('loading').classList.remove('active');
        showError('Ошибка: ' + error.message);
      })
      .getCallStats({ startDate: startDate, endDate: endDate, manager: manager });
  }
  
  function initManagerSelect(managers, selectedValue) {
    const select = document.getElementById('managerSelect');
    select.innerHTML = '<option value="all">Все менеджеры</option>';
    managers.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m;
      if (selectedValue === m) opt.selected = true;
      select.appendChild(opt);
    });
  }
  
  function renderCards(stats) {
    const wrapper = document.getElementById('cardsWrapper');
    const tableData = stats.data || [];
    const totals = stats.totals || {};
    const grandTotal = stats.grandTotal || 0;
    const managers = stats.managers || [];
    
    if (tableData.length === 0) {
      wrapper.innerHTML = `
        <div class="empty-state">
          <i class="material-icons">inbox</i>
          <p>Нет данных за выбранный период</p>
        </div>
      `;
      return;
    }
    
    // Сортируем даты от новых к старым
    const sortedData = [...tableData].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    let cardsHtml = '';
    
    for (const day of sortedData) {
      const date = day.date;
      let dayTotal = 0;
      
      // Собираем строки менеджеров
      let managersHtml = '';
      for (const m of managers) {
        const count = day[m] || 0;
        if (count > 0 || Object.keys(day).length > 1) { // показываем даже если 0
          dayTotal += count;
          managersHtml += `
            <div class="manager-row">
              <div class="manager-name">
                <i class="material-icons">account_circle</i>
                ${escapeHtml(m)}
              </div>
              <div class="manager-count">${count} зв.</div>
            </div>
          `;
        }
      }
      
      cardsHtml += `
        <div class="day-card">
          <div class="day-header" onclick="toggleDay(this)">
            <div class="day-date">
              <i class="material-icons">calendar_today</i>
              ${formatDate(date)}
            </div>
            <div class="day-total">📞 ${dayTotal} зв.</div>
          </div>
          <div class="day-stats">
            ${managersHtml}
          </div>
        </div>
      `;
    }
    
    // Итоговая карточка
    let totalsHtml = '';
    for (const m of managers) {
      const total = totals[m] || 0;
      if (total > 0) {
        totalsHtml += `<div class="total-manager">${escapeHtml(m)}: ${total} зв.</div>`;
      }
    }
    
    cardsHtml += `
      <div class="total-card">
        <div class="total-title">🏆 ИТОГО ЗА ПЕРИОД</div>
        <div class="total-value">${grandTotal} звонков</div>
        <div class="total-breakdown">
          ${totalsHtml}
        </div>
      </div>
    `;
    
    wrapper.innerHTML = cardsHtml;
  }
  
  function formatDate(dateStr) {
    // Преобразуем YYYY-MM-DD в DD.MM.YYYY
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
    return dateStr;
  }
  
  function toggleDay(element) {
    const dayStats = element.nextElementSibling;
    if (dayStats.style.display === 'none') {
      dayStats.style.display = 'block';
    } else {
      dayStats.style.display = 'none';
    }
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
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);
    document.getElementById('startDate').value = weekAgo.toISOString().split('T')[0];
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
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);
    document.getElementById('startDate').value = weekAgo.toISOString().split('T')[0];
    document.getElementById('endDate').value = today.toISOString().split('T')[0];
    loadStats();
  };
</script>
</body>
</html>
