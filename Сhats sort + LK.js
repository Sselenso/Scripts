// ==UserScript==
// @name         Выборка чатов оптимизация
// @namespace    http://tampermonkey.net/
// @version      6.4
// @description  Filter chats with period-based storage (Wednesday-Tuesday) with toggle - FIXED
// @author       Sselenso
// @match       https://ai.sknt.ru/?cat=chats_reports&action=getChatsList&date=*
// @updateURL    https://raw.githubusercontent.com/Sselenso/Scripts/main/Chats sort + LK.js
// @downloadURL  https://raw.githubusercontent.com/Sselenso/Scripts/main/Chats sort + LK.js
// ==/UserScript==

(function() {
    'use strict';

    // === ЗАГРУЗКА СТИЛЕЙ ===
    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Ubuntu:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400;1,500;1,700&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);

    const STYLES = `
        :root {
            --app-primary: var(--c-green-100);
            --app-primary-dark: var(--c-green-400);
            --app-bg: var(--c-white);
            --app-surface: var(--c-gray-40);
            --app-text: var(--c-gray-700);
            --app-text-secondary: var(--c-gray-600);
            --app-border: var(--c-gray-90);
            --app-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            --app-radius: 6px;
            --app-font: 'Ubuntu', sans-serif;
        }

        ::-webkit-scrollbar { width: 8px !important; height: 8px !important; }
        ::-webkit-scrollbar-thumb { background-color: var(--c-green-100); }

        .app-button-group {
            position: fixed;
            top: 60px;
            right: 20px;
            z-index: 9999;
            display: flex;
            gap: 10px;
        }

        .app-button {
            padding: 10px 20px;
            background: var(--app-primary);
            color: var(--c-white);
            border: none;
            border-radius: var(--app-radius);
            font-family: var(--app-font);
            font-weight: 500;
            cursor: pointer;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            transition: all 0.2s ease;
            white-space: nowrap;
        }

        .app-button:hover { background: var(--app-primary-dark); transform: translateY(-1px); }
        .app-button-cabinet { background: #5bc0de; }
        .app-button-cabinet:hover { background: #46b8da; }

        .app-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.4);
            z-index: 10000;
            display: none;
            justify-content: center;
            align-items: center;
            font-family: var(--app-font);
        }

        .app-modal-content {
            background: var(--app-bg);
            border-radius: var(--app-radius);
            max-width: 900px;
            width: 95%;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
            box-shadow: var(--app-shadow);
            overflow: hidden;
            animation: appSlideIn 0.2s ease-out;
        }

        @keyframes appSlideIn {
            from { opacity: 0; transform: scale(0.98); }
            to { opacity: 1; transform: scale(1); }
        }

        .app-header {
            background: var(--app-primary);
            color: var(--c-white);
            padding: 16px 24px;
            font-size: 18px;
            font-weight: 500;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .app-header-cabinet { background: #5bc0de; }
        .app-body { padding: 24px; overflow-y: auto; flex: 1; }
        .app-field { margin-bottom: 14px; display: flex; align-items: baseline; gap: 5px; justify-content: space-between; }
        .app-label { display: block; margin-bottom: 6px; font-weight: 500; color: var(--app-text-secondary); }

        .app-input, .app-select {
            width: 80%;
            padding: 10px 12px;
            border: 1px solid var(--app-border);
            border-radius: 4px;
            font-family: var(--app-font);
            background: var(--app-bg);
            color: var(--app-text);
            transition: border-color 0.2s;
            box-sizing: border-box;
        }

        .app-input:focus, .app-select:focus {
            outline: none;
            border-color: var(--app-primary);
            box-shadow: 0 0 0 2px rgba(92, 184, 92, 0.2);
        }

        .app-checkbox-label {
            display: flex;
            align-items: center;
            cursor: pointer;
            font-size: 14px;
            color: var(--app-text);
        }

        .app-checkbox { margin-right: 10px; accent-color: var(--app-primary); }

        .app-chip-group { display: flex; gap: 6px; flex-wrap: wrap; }
        .app-chip {
            display: inline-flex;
            align-items: center;
            padding: 5px 12px;
            background: var(--app-surface);
            border: 1px solid var(--app-border);
            border-radius: 16px;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s;
            user-select: none;
            color: var(--app-text);
        }

        .app-chip:hover { background: var(--c-gray-30); }
        .app-chip input[type="radio"] { display: none; }
        .app-chip:has(input:checked) {
            background: var(--c-green-50);
            border-color: var(--app-primary);
            color: var(--c-green-800);
            font-weight: 500;
        }

        .app-actions {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
            padding: 16px 24px;
            background: var(--c-gray-10);
            border-top: 1px solid var(--app-border);
        }

        .app-btn {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            font-family: var(--app-font);
        }

        .app-btn-primary { background: var(--app-primary); color: var(--c-white); }
        .app-btn-primary:hover { background: var(--app-primary-dark); }
        .app-btn-secondary { background: transparent; color: var(--app-text-secondary); border: 1px solid var(--app-border); }
        .app-btn-secondary:hover { background: var(--c-gray-30); color: var(--app-text); }

        .app-results {
            display: none;
            flex-direction: column;
            border-top: 1px solid var(--app-border);
            padding-top: 14px;
        }

        .app-results-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            flex-wrap: wrap;
            gap: 10px;
        }

        .app-results-title { margin: 0; font-size: 16px; font-weight: 500; color: var(--app-text); }
        .app-badge {
            background: var(--app-primary);
            color: var(--c-white);
            padding: 2px 10px;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 500;
        }

        .app-stats {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
            padding: 10px 12px;
            background: var(--c-gray-10);
            border-radius: var(--app-radius);
            margin-bottom: 12px;
            font-size: 14px;
        }

        .app-stat-item { display: flex; align-items: center; gap: 6px; }
        .app-stat-item .stat-label { color: var(--app-text-secondary); }
        .app-stat-item .stat-value { font-weight: 600; color: var(--app-text); }
        .app-stat-item .stat-value.green { color: var(--app-primary); }
        .app-stat-item .stat-value.red { color: #d9534f; }
        .app-stat-item .stat-value.orange { color: #f0ad4e; }

        .app-list {
            list-style: none;
            padding: 0;
            margin: 0;
            max-height: 420px;
            overflow-y: auto;
            scroll-behavior: smooth;
        }

        .app-card {
            background: var(--app-bg);
            border: 1px solid var(--app-border);
            border-left: 4px solid var(--app-primary);
            border-radius: 4px;
            padding: 12px;
            margin-bottom: 10px;
            transition: all 0.2s;
            margin-right: 5px;
            position: relative;
        }

        .app-card.marked-rejected { border-left-color: #d9534f; background: #fdf2f2; }
        .app-card.marked-checked { border-left-color: #5cb85c; background: #f0faf0; }
        .app-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.05); }

        .app-card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 6px;
            flex-wrap: wrap;
            gap: 8px;
        }

        .app-chat-id { font-weight: 600; color: var(--app-text); }
        .app-time { color: var(--app-text-secondary); font-size: 14px; }
        .app-meta { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
        .app-tag {
            background: var(--c-green-100);
            color: var(--c-white);
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 14px;
            font-weight: 500;
        }

        .app-rating { font-size: 14px; color: var(--c-orange-150); }
        .app-problem { margin-top: 6px; font-size: 14px; color: var(--app-text-secondary); line-height: 1.4; }
        .app-problem strong { color: var(--app-text); }
        .app-empty { text-align: center; padding: 30px; color: var(--app-text-secondary); font-size: 14px; }

        .app-card-actions {
            display: flex;
            gap: 6px;
            align-items: center;
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid var(--app-border);
        }

        .app-card-btn {
            padding: 4px 10px;
            border: none;
            border-radius: 4px;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s;
            background: transparent;
            display: flex;
            align-items: center;
            gap: 4px;
            font-family: var(--app-font);
            font-weight: 500;
        }

        .app-card-btn:hover { transform: scale(1.05); }
        .app-card-btn.btn-check { color: #5cb85c; background: #eaf7ea; }
        .app-card-btn.btn-check:hover { background: #d0edc9; }
        .app-card-btn.btn-check.active { background: #5cb85c; color: white; }
        .app-card-btn.btn-trash { color: #d9534f; background: #fdf0ef; }
        .app-card-btn.btn-trash:hover { background: #f5d6d4; }
        .app-card-btn.btn-trash.active { background: #d9534f; color: white; }
        .app-card-btn .btn-label { font-size: 12px; }

        .app-mark-status {
            font-size: 12px;
            padding: 2px 8px;
            border-radius: 4px;
            font-weight: 500;
        }

        .app-mark-status.status-checked { background: #5cb85c; color: white; }
        .app-mark-status.status-rejected { background: #d9534f; color: white; }
        .app-mark-status.status-none { background: var(--c-gray-30); color: var(--app-text-secondary); }

        .cabinet-period {
            font-size: 16px;
            font-weight: 500;
            color: var(--app-text);
            margin-bottom: 20px;
            padding: 10px 14px;
            background: var(--c-gray-10);
            border-radius: var(--app-radius);
        }

        .cabinet-specialist {
            background: var(--app-bg);
            border: 1px solid var(--app-border);
            border-radius: var(--app-radius);
            padding: 16px;
            margin-bottom: 14px;
        }

        .cabinet-specialist-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            flex-wrap: wrap;
            gap: 8px;
        }

        .cabinet-specialist-name { font-size: 17px; font-weight: 600; color: var(--app-text); }
        .cabinet-specialist-plan { font-size: 14px; color: var(--app-text-secondary); }
        .cabinet-specialist-plan .plan-done { font-weight: 600; color: var(--app-primary); }
        .cabinet-specialist-plan .plan-total { font-weight: 600; color: var(--app-text); }
        .cabinet-specialist-plan .plan-progress { font-weight: 600; color: #f0ad4e; }

        .cabinet-rating-row {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            margin-top: 8px;
            font-size: 14px;
        }

        .cabinet-rating-item {
            display: flex;
            align-items: center;
            gap: 4px;
            background: var(--c-gray-10);
            padding: 2px 10px;
            border-radius: 4px;
        }

        .cabinet-rating-item .rating-stars { color: var(--c-orange-150); }
        .cabinet-rating-item .rating-count { font-weight: 600; }

        .cabinet-total {
            margin-top: 20px;
            padding: 16px;
            background: var(--c-gray-10);
            border-radius: var(--app-radius);
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
            font-size: 15px;
        }

        .cabinet-total-item { display: flex; align-items: center; gap: 6px; }
        .cabinet-total-item .total-label { color: var(--app-text-secondary); }
        .cabinet-total-item .total-value { font-weight: 600; }
        .cabinet-empty { text-align: center; padding: 40px; color: var(--app-text-secondary); font-size: 15px; }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.textContent = STYLES;
    document.head.appendChild(styleSheet);

    // === КЭШИРОВАНИЕ ===
    const CACHE = {
        rows: null,
        chatData: new Map(),
        specialists: new Map(),
        ratings: new Map(),
        resultsList: null,
        statsContainer: null,
        resultsCount: null,
        resultsContainer: null,
        currentHash: '',
        currentChats: []
    };

    // === ХРАНИЛИЩЕ ===
    const STORAGE_KEY = 'chatFilterStates';
    const PLAN = 15;
    let chatStates = {};
    let isFiltering = false;
    let isModalOpen = false;

    // === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===
    function getTodayDate() {
        return new Date().toISOString().split('T')[0];
    }

    function getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = (day - 3 + 7) % 7;
        d.setDate(d.getDate() - diff);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    function getWeekEnd(weekStart) {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + 6);
        d.setHours(23, 59, 59, 999);
        return d;
    }

    function formatDate(date) {
        return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    }

    function formatPeriod(start, end) {
        return `${formatDate(start)} - ${formatDate(end)}`;
    }

    function isDateInPeriod(dateStr, weekStart, weekEnd) {
        const date = new Date(dateStr);
        return date >= weekStart && date <= weekEnd;
    }

    // === РАБОТА С ХРАНИЛИЩЕМ ===
    function loadChatStates() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (!data) return {};

            const allStates = JSON.parse(data);
            const today = new Date();
            const weekStart = getWeekStart(today);
            const weekEnd = getWeekEnd(weekStart);

            const periodStates = {};

            for (const [chatId, record] of Object.entries(allStates)) {
                if (record.date && isDateInPeriod(record.date, weekStart, weekEnd)) {
                    periodStates[chatId] = record;
                }
            }

            return periodStates;
        } catch (e) {
            return {};
        }
    }

    function saveChatStates(states) {
        try {
            const allData = localStorage.getItem(STORAGE_KEY);
            let allStates = allData ? JSON.parse(allData) : {};
            const today = getTodayDate();

            for (const [chatId, record] of Object.entries(states)) {
                if (record.status === 'none') {
                    delete allStates[chatId];
                } else {
                    allStates[chatId] = {
                        status: record.status,
                        date: record.date || today
                    };
                }
            }

            localStorage.setItem(STORAGE_KEY, JSON.stringify(allStates));
        } catch (e) {}
    }

    // === ПАРСИНГ ===
    function parseSpecialists(specialistHtml) {
        if (!specialistHtml) return [];
        if (CACHE.specialists.has(specialistHtml)) {
            return CACHE.specialists.get(specialistHtml);
        }

        const temp = document.createElement('div');
        temp.innerHTML = specialistHtml;
        const specialists = [];
        const items = temp.querySelectorAll('.s6a0412');

        for (const item of items) {
            const text = item.textContent.trim();
            const match = text.match(/^([А-Яа-яёЁ\s]+?)\s+\d{2}:\d{2}/);
            if (match) {
                const name = match[1].trim();
                if (name && name !== 'Общее') specialists.push(name);
            } else {
                const parts = text.split(/\d{2}:\d{2}/);
                if (parts.length > 0) {
                    const name = parts[0].trim();
                    if (name && name !== 'Общее') specialists.push(name);
                }
            }
        }

        CACHE.specialists.set(specialistHtml, specialists);
        return specialists;
    }

    function getUniqueSpecialists(specialists) {
        const unique = [];
        const seen = new Set();
        for (const name of specialists) {
            const normalized = name.toLowerCase().replace(/\s+/g, ' ').trim();
            if (!seen.has(normalized)) {
                seen.add(normalized);
                unique.push(name);
            }
        }
        return unique;
    }

    function getChatRating(cells) {
        const cacheKey = cells[0]?.textContent || '';
        if (CACHE.ratings.has(cacheKey)) {
            return CACHE.ratings.get(cacheKey);
        }

        const ratingCells = [6, 7, 8];
        for (let idx of ratingCells) {
            if (idx < cells.length) {
                const text = cells[idx].textContent.trim();
                if (text.includes('★') || text.includes('⭐') || /^[1-5]\s*[★⭐]/.test(text)) {
                    const match = text.match(/([1-5])/);
                    if (match) {
                        const rating = parseInt(match[1]);
                        CACHE.ratings.set(cacheKey, rating);
                        return rating;
                    }
                }
                const numMatch = text.match(/\b([1-5])\b/);
                if (numMatch && !text.includes(':')) {
                    const rating = parseInt(numMatch[1]);
                    CACHE.ratings.set(cacheKey, rating);
                    return rating;
                }
            }
        }
        CACHE.ratings.set(cacheKey, null);
        return null;
    }

    function getChatIdFromRow(row) {
        const cells = row.querySelectorAll('td');
        if (cells.length < 1) return null;
        const chatLink = cells[0].querySelector('a');
        return chatLink ? chatLink.textContent.trim() : null;
    }

    // === СБОР ДАННЫХ ===
    function getAllChatData() {
        if (CACHE.rows) {
            return CACHE.chatData;
        }

        CACHE.rows = document.querySelectorAll('tr.tcc699e');
        CACHE.chatData.clear();

        const rows = CACHE.rows;
        const seenIds = new Set();

        for (const row of rows) {
            const cells = row.querySelectorAll('td');
            if (cells.length < 11) continue;

            const chatId = getChatIdFromRow(row);
            if (!chatId || seenIds.has(chatId)) continue;
            seenIds.add(chatId);

            const specialistHtml = cells[10].innerHTML;
            const specialists = parseSpecialists(specialistHtml);
            const uniqueSpecialists = getUniqueSpecialists(specialists);

            const state = chatStates[chatId]?.status || 'none';

            CACHE.chatData.set(chatId, {
                id: chatId,
                time: cells[2]?.textContent.trim() || 'N/A',
                problem: cells[8]?.textContent.trim() || '',
                tags: cells[9]?.textContent.trim() || 'N/A',
                specialists: uniqueSpecialists,
                rating: getChatRating(cells),
                link: row.querySelector('td:first-child a')?.href || '#',
                state: state,
                row: row,
                cells: cells
            });
        }

        return CACHE.chatData;
    }

    // === ГЕНЕРАЦИЯ ХЕША ===
    function generateHash(chats) {
        return chats.map(c => `${c.id}:${c.state}`).join('|');
    }

    // === ГЕНЕРАЦИЯ HTML ДЛЯ КАРТОЧКИ ===
    function generateCardHTML(chat) {
        const state = chatStates[chat.id]?.status || 'none';
        const isChecked = state === 'checked';
        const isRejected = state === 'rejected';
        const specialistNames = chat.specialists.join(', ');
        let ratingDisplay = '—';
        if (chat.rating) {
            ratingDisplay = '★'.repeat(chat.rating) + '☆'.repeat(5 - chat.rating);
        }

        const statusMap = {
            'checked': '<span class="app-mark-status status-checked">Проверен</span>',
            'rejected': '<span class="app-mark-status status-rejected">Отклонен</span>',

        };

        return `
            <div class="app-card-header">
                <div>
                    <span class="app-chat-id">#${chat.id}</span>
                    <span class="app-time"> • ${chat.time}</span>
                    ${statusMap[state] || statusMap.none}
                </div>
                <div class="app-meta">
                    <span class="app-tag">${specialistNames}</span>
                    <span class="app-rating">${ratingDisplay}</span>
                </div>
            </div>
            <div class="app-problem">
                <strong>Проблема:</strong> ${chat.problem || 'Не указана'}<br>
                <strong>Теги:</strong> ${chat.tags || 'Нет тегов'}
            </div>
            <div class="app-card-actions">
                <button class="app-card-btn btn-check ${isChecked ? 'active' : ''}" data-chat-id="${chat.id}" data-action="check">
                    <span class="btn-label">${isChecked ? '✅ Проверен' : 'Проверить'}</span>
                </button>
                <button class="app-card-btn btn-trash ${isRejected ? 'active' : ''}" data-chat-id="${chat.id}" data-action="reject">
                    <span class="btn-label">${isRejected ? '🗑 Отклонен' : 'Отклонить'}</span>
                </button>
                <span style="font-size:12px;color:var(--app-text-secondary);margin-left:auto;">
                    ${isChecked ? '✅ Проверен' : isRejected ? '🗑 Отклонен' : 'Не отмечен'}
                </span>
            </div>
        `;
    }

    // === ПЕРЕКЛЮЧЕНИЕ СТАТУСА ===
    function toggleChatState(chatId, status) {
        const current = chatStates[chatId]?.status || 'none';

        if (current === status) {
            delete chatStates[chatId];
        } else {
            chatStates[chatId] = {
                status: status,
                date: getTodayDate()
            };
        }

        saveChatStates(chatStates);

        // Обновляем кэш
        const chatData = CACHE.chatData.get(chatId);
        if (chatData) {
            chatData.state = chatStates[chatId]?.status || 'none';
        }

        CACHE.currentHash = generateHash(CACHE.currentChats);
    }

    // === ОБНОВЛЕНИЕ СТАТИСТИКИ ===
    function updateStats() {
        const chats = CACHE.currentChats;
        const statsContainer = CACHE.statsContainer;
        const resultsCount = CACHE.resultsCount;

        if (!statsContainer) return;

        const activeChats = chats.filter(chat => {
            const state = chatStates[chat.id]?.status || 'none';
            return state !== 'rejected';
        });

        const total = activeChats.length;
        const rated = activeChats.filter(c => c.rating !== null);
        const unrated = activeChats.filter(c => c.rating === null);
        const checked = activeChats.filter(c => (chatStates[c.id]?.status || 'none') === 'checked');
        const rejected = chats.filter(c => (chatStates[c.id]?.status || 'none') === 'rejected');

        const needCheckRated = Math.ceil(rated.length * 0.1);
        const needCheckUnrated = Math.ceil(unrated.length * 0.15);
        const totalNeedCheck = needCheckRated + needCheckUnrated;

        statsContainer.style.display = 'flex';
        statsContainer.innerHTML = `
            <div class="app-stat-item"><span class="stat-label">Всего:</span><span class="stat-value">${total}</span></div>
            <div class="app-stat-item"><span class="stat-label">С оценкой:</span><span class="stat-value">${rated.length}</span><span class="stat-label">(10% = </span><span class="stat-value orange">${needCheckRated}</span><span class="stat-label">)</span></div>
            <div class="app-stat-item"><span class="stat-label">Без оценки:</span><span class="stat-value">${unrated.length}</span><span class="stat-label">(15% = </span><span class="stat-value orange">${needCheckUnrated}</span><span class="stat-label">)</span></div>
            <div class="app-stat-item"><span class="stat-label">Проверено:</span><span class="stat-value green">${checked.length}</span></div>
            <div class="app-stat-item"><span class="stat-label">Отклонено:</span><span class="stat-value red">${rejected.length}</span></div>
            <div class="app-stat-item"><span class="stat-label">Осталось:</span><span class="stat-value orange">${Math.max(0, totalNeedCheck - checked.length)}</span></div>
        `;

        if (resultsCount) {
            resultsCount.textContent = chats.length;
        }
    }

    // === ТОЧЕЧНОЕ ОБНОВЛЕНИЕ КАРТОЧКИ ===
    function updateCardUI(chatId) {
        const chat = CACHE.chatData.get(chatId);
        if (!chat) return;

        chat.state = chatStates[chatId]?.status || 'none';

        const card = document.querySelector(`.app-card[data-chat-id="${chatId}"]`);
        if (card) {
            card.className = `app-card ${chat.state === 'rejected' ? 'marked-rejected' : ''} ${chat.state === 'checked' ? 'marked-checked' : ''}`;
            card.innerHTML = generateCardHTML(chat);
            updateStats();
            CACHE.currentHash = generateHash(CACHE.currentChats);
        }
    }

    // === РЕНДЕРИНГ СПИСКА ===
    function renderResults(chats) {
        const resultsList = CACHE.resultsList;
        const resultsContainer = CACHE.resultsContainer;
        const statsContainer = CACHE.statsContainer;

        if (!resultsList) return;

        CACHE.currentChats = chats;

        for (const chat of chats) {
            chat.state = chatStates[chat.id]?.status || 'none';
        }

        const newHash = generateHash(chats);

        if (newHash === CACHE.currentHash && resultsList.querySelector('.app-card')) {
            updateStats();
            return;
        }

        CACHE.currentHash = newHash;

        if (chats.length === 0) {
            resultsList.innerHTML = '<p class="app-empty">Чатов не найдено</p>';
            resultsContainer.style.display = 'flex';
            if (statsContainer) statsContainer.style.display = 'none';
            return;
        }

        let html = '<ul class="app-list">';
        for (const chat of chats) {
            const state = chat.state;
            const isChecked = state === 'checked';
            const isRejected = state === 'rejected';
            html += `
                <li class="app-card ${isRejected ? 'marked-rejected' : ''} ${isChecked ? 'marked-checked' : ''}" data-chat-id="${chat.id}" data-link="${chat.link}">
                    ${generateCardHTML(chat)}
                </li>
            `;
        }
        html += '</ul>';

        resultsList.innerHTML = html;
        resultsContainer.style.display = 'flex';
        updateStats();
    }

    // === БЫСТРЫЙ ФИЛЬТР ===
    function applyFilter() {
        if (isFiltering) return;
        isFiltering = true;

        setTimeout(() => {
            try {
                const surnameInput = document.getElementById('specialistSurname');
                const onlyOneCheckbox = document.getElementById('onlyOneSpecialist');
                const ratingRadios = document.querySelectorAll('input[name="rating"]');
                const problemSelect = document.getElementById('problemFilter');

                const searchSurname = surnameInput.value.trim().toLowerCase();
                const onlyOne = onlyOneCheckbox.checked;
                const problemFilter = problemSelect.value;

                let selectedRating = 'all';
                for (const radio of ratingRadios) {
                    if (radio.checked) {
                        selectedRating = radio.value;
                        break;
                    }
                }

                const chatDataMap = getAllChatData();
                const filtered = [];

                for (const [chatId, chat] of chatDataMap) {
                    if (onlyOne && chat.specialists.length !== 1) continue;

                    if (searchSurname) {
                        let found = false;
                        for (const name of chat.specialists) {
                            if (name.toLowerCase().includes(searchSurname)) {
                                found = true;
                                break;
                            }
                        }
                        if (!found) continue;
                    }

                    if (problemFilter !== 'all' && !matchesProblem(chat.problem, problemFilter)) continue;

                    if (selectedRating === 'no_rating' && chat.rating !== null) continue;
                    if (selectedRating !== 'all' && selectedRating !== 'no_rating') {
                        const ratingNum = parseInt(selectedRating);
                        if (chat.rating === null || chat.rating !== ratingNum) continue;
                    }

                    filtered.push(chat);
                }

                renderResults(filtered);

            } finally {
                isFiltering = false;
            }
        }, 10);
    }

    // === ПРОВЕРКА ПРОБЛЕМЫ ===
    function matchesProblem(problemText, problemFilter) {
        if (problemFilter === 'all') return true;
        const problem = problemText.toLowerCase();
        const filterMap = {
            'wifi': ['wifi', 'wi-fi', 'беспроводной'],
            'speed': ['скорость', 'speed'],
            'connection': ['интернет проблемы', 'проблемы интернет', 'интернет'],
            'router': ['роутер', 'маршрутизатор', 'router'],
            'reboot': ['ребут', 'перезагрузк', 'reboot'],
            'repair': ['ремонт', 'repair'],
            'payment': ['финансы', 'платеж', 'оплат', 'payment'],
            'refusal': ['отказ', 'refusal'],
            'freeze': ['заморозк', 'freeze'],
            'tariff': ['тариф', 'tariff'],
            'equipment': ['оборудование', 'equipment'],
            'connection_issue': ['подключение', 'connection'],
            'undefined': ['неопределен', 'undefined'],
            'conditions': ['смена условий', 'условий'],
            'lag': ['лагает', 'тормозит', 'lag']
        };
        const keywords = filterMap[problemFilter] || [];
        return keywords.some(keyword => problem.includes(keyword));
    }

    // === ОБРАБОТЧИК КЛИКОВ ===
    function setupClickHandler() {
        const resultsList = CACHE.resultsList;
        if (!resultsList) return;

        if (resultsList._clickHandler) {
            resultsList.removeEventListener('click', resultsList._clickHandler);
        }

        const handler = function(e) {
            const btn = e.target.closest('.app-card-btn');
            if (btn) {
                e.stopPropagation();
                const chatId = btn.dataset.chatId;
                const action = btn.dataset.action;

                if (chatId && action) {
                    toggleChatState(chatId, action === 'check' ? 'checked' : 'rejected');
                    updateCardUI(chatId);
                }
                return;
            }

            const card = e.target.closest('.app-card');
            if (card) {
                const link = card.dataset.link;
                if (link && link !== '#') {
                    window.open(link, '_blank');
                }
            }
        };

        resultsList.addEventListener('click', handler);
        resultsList._clickHandler = handler;
    }

    // === СОЗДАНИЕ UI ===
    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'app-button-group';

    const filterButton = document.createElement('button');
    filterButton.textContent = 'Фильтр чатов';
    filterButton.className = 'app-button';
    buttonGroup.appendChild(filterButton);

    const cabinetButton = document.createElement('button');
    cabinetButton.textContent = '📊 ЛК';
    cabinetButton.className = 'app-button app-button-cabinet';
    buttonGroup.appendChild(cabinetButton);

    document.body.appendChild(buttonGroup);

    // === МОДАЛЬНОЕ ОКНО ===
    const modal = document.createElement('div');
    modal.className = 'app-modal';
    modal.style.display = 'none';

    modal.innerHTML = `
        <div class="app-modal-content">
            <div class="app-header">
                <span>Фильтр чатов</span>
                <button id="closeFilterBtn" class="app-btn" style="background:rgba(255,255,255,0.2);color:white;border:none;padding:4px 12px;border-radius:4px;cursor:pointer;">✕</button>
            </div>
            <div class="app-body">
                <div class="app-field">
                    <label class="app-label">Специалист</label>
                    <input type="text" id="specialistSurname" class="app-input" placeholder="Введите фамилию">
                </div>
                <div class="app-field">
                    <label class="app-checkbox-label">
                        <input type="checkbox" id="onlyOneSpecialist" class="app-checkbox" checked>
                        Только один специалист в чате
                    </label>
                </div>
                <div class="app-field">
                    <label class="app-label">Оценка</label>
                    <div class="app-chip-group">
                        <label class="app-chip"><input type="radio" name="rating" value="all" checked>Все</label>
                        <label class="app-chip"><input type="radio" name="rating" value="5">★★★★★</label>
                        <label class="app-chip"><input type="radio" name="rating" value="4">★★★★☆</label>
                        <label class="app-chip"><input type="radio" name="rating" value="3">★★★☆☆</label>
                        <label class="app-chip"><input type="radio" name="rating" value="2">★★☆☆☆</label>
                        <label class="app-chip"><input type="radio" name="rating" value="1">★☆☆☆☆</label>
                        <label class="app-chip"><input type="radio" name="rating" value="no_rating">Без оценки</label>
                    </div>
                </div>
                <div class="app-field">
                    <label class="app-label">Проблема</label>
                    <select id="problemFilter" class="app-select">
                        <option value="all">Все проблемы</option>
                        <option value="wifi">WiFi</option>
                        <option value="speed">Скорость</option>
                        <option value="connection">Интернет проблемы</option>
                        <option value="router">Роутер</option>
                        <option value="reboot">Ребут</option>
                        <option value="repair">Ремонт</option>
                        <option value="payment">Финансы и платежи</option>
                        <option value="refusal">Отказ от пользования</option>
                        <option value="freeze">Заморозка</option>
                        <option value="tariff">Тариф</option>
                        <option value="equipment">Оборудование</option>
                        <option value="connection_issue">Подключение</option>
                        <option value="undefined">Неопределенные запросы</option>
                        <option value="conditions">Смена условий</option>
                        <option value="lag">Лагает ресурс</option>
                    </select>
                </div>
                <div id="resultsContainer" class="app-results">
                    <div class="app-results-header">
                        <h3 class="app-results-title">Результаты</h3>
                        <span id="resultsCount" class="app-badge">0</span>
                    </div>
                    <div id="statsContainer" class="app-stats" style="display:none;"></div>
                    <div id="resultsList" class="app-list"></div>
                </div>
            </div>
            <div class="app-actions">
                <button id="clearFilterBtn" class="app-btn app-btn-secondary">Очистить</button>
                <button id="closeFilterBtn2" class="app-btn app-btn-secondary">Закрыть</button>
                <button id="applyFilterBtn" class="app-btn app-btn-primary">Применить</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // === КЭШИРОВАНИЕ ЭЛЕМЕНТОВ ===
    CACHE.resultsList = document.getElementById('resultsList');
    CACHE.resultsContainer = document.getElementById('resultsContainer');
    CACHE.resultsCount = document.getElementById('resultsCount');
    CACHE.statsContainer = document.getElementById('statsContainer');

    // === УПРАВЛЕНИЕ МОДАЛЬНЫМ ОКНОМ ===
    function lockScroll() {
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
    }

    function unlockScroll() {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
    }

    function openFilter() {
        if (isModalOpen) return;
        isModalOpen = true;

        modal.style.display = 'flex';
        lockScroll();

        if (Object.keys(chatStates).length === 0) {
            chatStates = loadChatStates();
        }

        CACHE.rows = null;
        CACHE.chatData.clear();
        CACHE.currentHash = '';

        applyFilter();
        // Устанавливаем обработчик после рендеринга
        setTimeout(setupClickHandler, 50);
    }

    function closeFilter() {
        modal.style.display = 'none';
        unlockScroll();
        isModalOpen = false;
    }

    // === ОБРАБОТЧИКИ СОБЫТИЙ ===
    filterButton.addEventListener('click', openFilter);
    cabinetButton.addEventListener('click', openCabinet);

    document.getElementById('closeFilterBtn').addEventListener('click', closeFilter);
    document.getElementById('closeFilterBtn2').addEventListener('click', closeFilter);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            closeFilter();
        }
    });

    document.getElementById('applyFilterBtn').addEventListener('click', () => {
        CACHE.currentHash = '';
        applyFilter();
        setTimeout(setupClickHandler, 50);
    });

    document.getElementById('clearFilterBtn').addEventListener('click', () => {
        document.getElementById('specialistSurname').value = '';
        document.getElementById('onlyOneSpecialist').checked = true;
        document.querySelectorAll('input[name="rating"]').forEach(radio => {
            if (radio.value === 'all') radio.checked = true;
        });
        document.getElementById('problemFilter').value = 'all';
        CACHE.resultsContainer.style.display = 'none';
        CACHE.resultsList.innerHTML = '';
        CACHE.statsContainer.style.display = 'none';
        CACHE.currentHash = '';
        CACHE.currentChats = [];
    });

    // Оптимизированные обработчики
    let filterTimer = null;
    const handleFilterChange = () => {
        clearTimeout(filterTimer);
        filterTimer = setTimeout(() => {
            CACHE.currentHash = '';
            applyFilter();
            setTimeout(setupClickHandler, 50);
        }, 100);
    };

    document.getElementById('specialistSurname').addEventListener('input', handleFilterChange);
    document.getElementById('specialistSurname').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            clearTimeout(filterTimer);
            CACHE.currentHash = '';
            applyFilter();
            setTimeout(setupClickHandler, 50);
        }
    });

    document.getElementById('onlyOneSpecialist').addEventListener('change', handleFilterChange);
    document.querySelectorAll('input[name="rating"]').forEach(radio => {
        radio.addEventListener('change', handleFilterChange);
    });
    document.getElementById('problemFilter').addEventListener('change', handleFilterChange);

    // === ЛИЧНЫЙ КАБИНЕТ ===
    function openCabinet() {
        const today = new Date();
        const weekStart = getWeekStart(today);
        const weekEnd = getWeekEnd(weekStart);
        const periodStr = formatPeriod(weekStart, weekEnd);

        const specialistsData = {};
        let totalChecked = 0;
        let totalRejected = 0;

        const rows = document.querySelectorAll('tr.tcc699e');

        for (const row of rows) {
            const cells = row.querySelectorAll('td');
            if (cells.length < 11) continue;

            const chatIdCell = cells[0];
            const chatLink = chatIdCell.querySelector('a');
            const chatId = chatLink ? chatLink.textContent.trim() : null;
            if (!chatId) continue;

            const record = chatStates[chatId];
            if (!record || !record.date) continue;
            if (!isDateInPeriod(record.date, weekStart, weekEnd)) continue;

            const specialistHtml = cells[10].innerHTML;
            const specialists = parseSpecialists(specialistHtml);
            const uniqueSpecialists = getUniqueSpecialists(specialists);
            const specialist = uniqueSpecialists.length > 0 ? uniqueSpecialists[0] : 'Неизвестный';

            const rating = getChatRating(cells);
            const state = chatStates[chatId]?.status || 'none';

            if (!specialistsData[specialist]) {
                specialistsData[specialist] = {
                    checked: 0,
                    rejected: 0,
                    ratings: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 'no_rating': 0 }
                };
            }

            if (state === 'checked') {
                specialistsData[specialist].checked++;
                totalChecked++;
                if (rating !== null) {
                    specialistsData[specialist].ratings[rating] = (specialistsData[specialist].ratings[rating] || 0) + 1;
                } else {
                    specialistsData[specialist].ratings['no_rating']++;
                }
            } else if (state === 'rejected') {
                specialistsData[specialist].rejected++;
                totalRejected++;
            }
        }

        let html = `
            <div class="cabinet-period">
                📅 Период: <strong>${periodStr}</strong> (среда - вторник)
            </div>
        `;

        if (Object.keys(specialistsData).length === 0) {
            html += `
                <div class="cabinet-empty">
                    📭 Нет данных за текущий период<br>
                    <span style="font-size:13px;color:var(--app-text-secondary);">
                        Начните проверять чаты, и статистика появится здесь
                    </span>
                </div>
            `;
        } else {
            const sortedSpecialists = Object.entries(specialistsData).sort((a, b) => b[1].checked - a[1].checked);

            for (const [name, data] of sortedSpecialists) {
                const checked = data.checked;
                const rejected = data.rejected;
                const isPlanDone = checked >= PLAN;

                html += `
                    <div class="cabinet-specialist">
                        <div class="cabinet-specialist-header">
                            <span class="cabinet-specialist-name">${name}</span>
                            <span class="cabinet-specialist-plan">
                                ✅ Проверено: <span class="plan-done">${checked}</span>
                                (план: <span class="plan-total">${PLAN}</span>)
                                ${isPlanDone ? ' 🎉' : ` — <span class="plan-progress">осталось ${PLAN - checked}</span>`}
                            </span>
                        </div>
                        <div class="cabinet-rating-row">
                            ${data.ratings[5] > 0 ? `<span class="cabinet-rating-item"><span class="rating-stars">★★★★★</span> <span class="rating-count">${data.ratings[5]}</span></span>` : ''}
                            ${data.ratings[4] > 0 ? `<span class="cabinet-rating-item"><span class="rating-stars">★★★★☆</span> <span class="rating-count">${data.ratings[4]}</span></span>` : ''}
                            ${data.ratings[3] > 0 ? `<span class="cabinet-rating-item"><span class="rating-stars">★★★☆☆</span> <span class="rating-count">${data.ratings[3]}</span></span>` : ''}
                            ${data.ratings[2] > 0 ? `<span class="cabinet-rating-item"><span class="rating-stars">★★☆☆☆</span> <span class="rating-count">${data.ratings[2]}</span></span>` : ''}
                            ${data.ratings[1] > 0 ? `<span class="cabinet-rating-item"><span class="rating-stars">★☆☆☆☆</span> <span class="rating-count">${data.ratings[1]}</span></span>` : ''}
                            ${data.ratings['no_rating'] > 0 ? `<span class="cabinet-rating-item">Без оценки: <span class="rating-count">${data.ratings['no_rating']}</span></span>` : ''}
                            ${rejected > 0 ? `<span class="cabinet-rating-item" style="color:#d9534f;">🗑 Отклонено: ${rejected}</span>` : ''}
                        </div>
                    </div>
                `;
            }

            const totalCheckedAll = Object.values(specialistsData).reduce((sum, d) => sum + d.checked, 0);
            const totalRejectedAll = Object.values(specialistsData).reduce((sum, d) => sum + d.rejected, 0);
            const totalSpecialists = Object.keys(specialistsData).length;

            html += `
                <div class="cabinet-total">
                    <div class="cabinet-total-item">
                        <span class="total-label">👨‍💼 Специалистов:</span>
                        <span class="total-value">${totalSpecialists}</span>
                    </div>
                    <div class="cabinet-total-item">
                        <span class="total-label">✅ Всего проверено:</span>
                        <span class="total-value" style="color:var(--app-primary);">${totalCheckedAll}</span>
                    </div>
                    <div class="cabinet-total-item">
                        <span class="total-label">🗑 Всего отклонено:</span>
                        <span class="total-value" style="color:#d9534f;">${totalRejectedAll}</span>
                    </div>
                    <div class="cabinet-total-item">
                        <span class="total-label">📊 Средний прогресс:</span>
                        <span class="total-value" style="color:#f0ad4e;">
                            ${totalSpecialists > 0 ? Math.round((totalCheckedAll / (totalSpecialists * PLAN)) * 100) : 0}%
                        </span>
                    </div>
                </div>
            `;
        }

        const cabinetModal = document.createElement('div');
        cabinetModal.className = 'app-modal';
        cabinetModal.style.display = 'flex';

        cabinetModal.innerHTML = `
            <div class="app-modal-content">
                <div class="app-header app-header-cabinet">
                    <span>📊 Личный кабинет</span>
                    <button id="closeCabinetBtn" class="app-btn" style="background:rgba(255,255,255,0.2);color:white;border:none;padding:4px 12px;border-radius:4px;cursor:pointer;">✕</button>
                </div>
                <div class="app-body">
                    ${html}
                </div>
                <div class="app-actions">
                    <button id="closeCabinetBtn2" class="app-btn app-btn-secondary">Закрыть</button>
                </div>
            </div>
        `;

        document.body.appendChild(cabinetModal);
        lockScroll();

        function closeCabinet() {
            cabinetModal.remove();
            unlockScroll();
        }

        cabinetModal.querySelector('#closeCabinetBtn').addEventListener('click', closeCabinet);
        cabinetModal.querySelector('#closeCabinetBtn2').addEventListener('click', closeCabinet);
        cabinetModal.addEventListener('click', (e) => {
            if (e.target === cabinetModal) closeCabinet();
        });
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeCabinet();
            }
        }, { once: true });
    }

    // === ИНИЦИАЛИЗАЦИЯ ===
    chatStates = loadChatStates();   

})();