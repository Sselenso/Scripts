// ==UserScript==
// @name         Выборка чатов 3.0
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Filter chats by specialist, rating, and problem - Native UI Integration
// @author       Alice (Sselenso)
// @match       https://ai.sknt.ru/?cat=chats_reports&action=getChatsList&date=*
// @updateURL    https://raw.githubusercontent.com/Sselenso/Scripts/main/Chats sort.js
// @downloadURL  https://raw.githubusercontent.com/Sselenso/Scripts/main/Chats sort.js
// ==/UserScript==

(function() {
    'use strict';

    // 1. ИМПОРТ ШРИФТА UBUNTU
    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Ubuntu:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400;1,500;1,700&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);

    // 2. СТИЛИ НА ОСНОВЕ ПАЛИТРЫ САЙТА
    const STYLES = `
        :root {
            /* Используем переменные сайта для идеального слияния */
            --app-primary: var(--c-green-100);       /* #5cb85c */
            --app-primary-dark: var(--c-green-400);  /* #4cae4c */
            --app-bg: var(--c-white);                /* #fff */
            --app-surface: var(--c-gray-40);         /* #f5f5f5 */
            --app-text: var(--c-gray-700);           /* #333333 */
            --app-text-secondary: var(--c-gray-600); /* #666666 */
            --app-border: var(--c-gray-90);          /* #e7e7e7 */
            --app-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            --app-radius: 6px;
            --app-font: 'Ubuntu', sans-serif;
        }

        .app-button {
            position: fixed;
            top: 60px;
            right: 20px;
            z-index: 9999;
            padding: 10px 20px;
            background: var(--app-primary);
            color: var(--c-white);
            border: none;
            border-radius: var(--app-radius);
            font-family: var(--app-font);
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            transition: all 0.2s ease;
        }

        .app-button:hover {
            background: var(--app-primary-dark);
            transform: translateY(-1px);
        }

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
            max-width: 800px;
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

        .app-body {
            padding: 24px;
            overflow-y: auto;
            flex: 1;
        }

        .app-field {
            margin-bottom: 14px;
        }

        .app-label {
            display: block;
            margin-bottom: 6px;
            font-weight: 500;
            color: var(--app-text-secondary);
        }

        .app-input,
        .app-select {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid var(--app-border);
            border-radius: 4px;
            font-size: 14px;
            font-family: var(--app-font);
            background: var(--app-bg);
            color: var(--app-text);
            transition: border-color 0.2s;
            box-sizing: border-box;
        }

        .app-input:focus,
        .app-select:focus {
            outline: none;
            border-color: var(--app-primary);
            box-shadow: 0 0 0 2px rgba(92, 184, 92, 0.2);
        }

        .app-hint {
            margin-top: 4px;
            font-size: 12px;
            color: var(--c-gray-300);
        }

        .app-checkbox-label {
            display: flex;
            align-items: center;
            cursor: pointer;
            font-size: 14px;
            color: var(--app-text);
        }

        .app-checkbox {
            margin-right: 10px;
            accent-color: var(--app-primary);
        }

        .app-chip-group {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
        }

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

        .app-chip:hover {
            background: var(--c-gray-30);
        }

        .app-chip input[type="radio"] {
            display: none;
        }

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

        .app-btn-primary {
            background: var(--app-primary);
            color: var(--c-white);
        }

        .app-btn-primary:hover {
            background: var(--app-primary-dark);
        }

        .app-btn-secondary {
            background: transparent;
            color: var(--app-text-secondary);
            border: 1px solid var(--app-border);
        }

        .app-btn-secondary:hover {
            background: var(--c-gray-30);
            color: var(--app-text);
        }

        .app-results {
            display: none;
            flex-direction: column;
            border-top: 1px solid var(--app-border);
            padding-top: 20px;
        }

        .app-results-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
        }

        .app-results-title {
            margin: 0;
            font-size: 16px;
            font-weight: 500;
            color: var(--app-text);
        }

        .app-badge {
            background: var(--app-primary);
            color: var(--c-white);
            padding: 2px 10px;
            border-radius: 10px;
            font-size: 12px;
            font-weight: 500;
        }

        .app-list {
            list-style: none;
            padding: 0;
            margin: 0;
            max-height: 400px;
            overflow-y: auto;
        }

        .app-card {
            background: var(--app-bg);
            border: 1px solid var(--app-border);
            border-left: 4px solid var(--app-primary);
            border-radius: 4px;
            padding: 14px;
            margin-bottom: 10px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .app-card:hover {
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            border-color: var(--c-green-400);
        }

        .app-card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 6px;
            flex-wrap: wrap;
            gap: 8px;
        }

        .app-chat-id {
            font-weight: 600;
            color: var(--app-text);
            font-size: 14px;
        }

        .app-time {
            color: var(--app-text-secondary);
            font-size: 12px;
        }

        .app-meta {
            display: flex;
            gap: 6px;
            align-items: center;
            flex-wrap: wrap;
        }

        .app-tag {
            background: var(--c-green-100);
            color: var(--c-white);
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
        }

        .app-rating {
            font-size: 13px;
            color: var(--c-orange-150);
        }

        .app-problem {
            margin-top: 6px;
            font-size: 13px;
            color: var(--app-text-secondary);
            line-height: 1.4;
        }

        .app-problem strong {
            color: var(--app-text);
        }

        .app-empty {
            text-align: center;
            padding: 30px;
            color: var(--app-text-secondary);
            font-size: 14px;
        }
    `;

    // Добавляем стили
    const styleSheet = document.createElement('style');
    styleSheet.textContent = STYLES;
    document.head.appendChild(styleSheet);

    // Создаем кнопку
    const button = document.createElement('button');
    button.textContent = 'Фильтр чатов';
    button.className = 'app-button';
    document.body.appendChild(button);

    // Создаем модальное окно
    const modal = document.createElement('div');
    modal.className = 'app-modal';

    const modalContent = document.createElement('div');
    modalContent.className = 'app-modal-content';

    modalContent.innerHTML = `
        <div class="app-header">
            <span>Фильтр чатов</span>
        </div>

        <div class="app-body">
            <!-- Фильтр по специалисту -->
            <div class="app-field">
                <label class="app-label">Специалист</label>
                <input type="text" id="specialistSurname" class="app-input" placeholder="Введите фамилию">
            </div>

            <!-- Фильтр по количеству специалистов -->
            <div class="app-field">
                <label class="app-checkbox-label">
                    <input type="checkbox" id="onlyOneSpecialist" class="app-checkbox" checked>
                    Только один специалист в чате
                </label>
            </div>

            <!-- Фильтр по оценке -->
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

            <!-- Фильтр по проблемам -->
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

            <!-- Результаты -->
            <div id="resultsContainer" class="app-results">
                <div class="app-results-header">
                    <h3 class="app-results-title">Результаты</h3>
                    <span id="resultsCount" class="app-badge">0</span>
                </div>
                <div id="resultsList" class="app-list"></div>
            </div>
        </div>

        <!-- Кнопки -->
        <div class="app-actions">
            <button id="clearFilterBtn" class="app-btn app-btn-secondary">Очистить</button>
            <button id="closeModalBtn" class="app-btn app-btn-secondary">Закрыть</button>
            <button id="applyFilterBtn" class="app-btn app-btn-primary">Применить</button>
        </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // === ФУНКЦИИ УПРАВЛЕНИЯ СКРОЛЛОМ ===
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

    // Функция для парсинга специалистов из строки
    function parseSpecialists(specialistHtml) {
        if (!specialistHtml) return [];
        const temp = document.createElement('div');
        temp.innerHTML = specialistHtml;
        const specialists = [];
        const items = temp.querySelectorAll('.s6a0412');
        items.forEach(item => {
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
        });
        return specialists;
    }

    function getChatRating(cells) {
        const ratingCells = [6, 7, 8];
        for (let idx of ratingCells) {
            if (idx < cells.length) {
                const cell = cells[idx];
                const text = cell.textContent.trim();
                if (text.includes('★') || text.includes('⭐') || /^[1-5]\s*[★⭐]/.test(text)) {
                    const match = text.match(/([1-5])/);
                    if (match) return parseInt(match[1]);
                }
                const numMatch = text.match(/\b([1-5])\b/);
                if (numMatch && !text.includes(':')) return parseInt(numMatch[1]);
            }
        }
        return null;
    }

    function getAllChatRows() {
        return document.querySelectorAll('tr.tcc699e');
    }

    function normalizeName(name) {
        return name.toLowerCase().replace(/\s+/g, ' ').trim();
    }

    function isDuplicateName(name, existingNames) {
        const normalized = normalizeName(name);
        return existingNames.some(existing => normalizeName(existing) === normalized);
    }

    function getUniqueSpecialists(specialists) {
        const unique = [];
        specialists.forEach(name => {
            if (!isDuplicateName(name, unique)) unique.push(name);
        });
        return unique;
    }

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

    function filterChats() {
        const surnameInput = document.getElementById('specialistSurname');
        const onlyOneCheckbox = document.getElementById('onlyOneSpecialist');
        const ratingRadios = document.querySelectorAll('input[name="rating"]');
        const problemSelect = document.getElementById('problemFilter');
        const resultsList = document.getElementById('resultsList');
        const resultsContainer = document.getElementById('resultsContainer');
        const resultsCount = document.getElementById('resultsCount');

        const searchSurname = surnameInput.value.trim().toLowerCase();
        const onlyOne = onlyOneCheckbox.checked;
        const problemFilter = problemSelect.value;

        let selectedRating = 'all';
        ratingRadios.forEach(radio => {
            if (radio.checked) selectedRating = radio.value;
        });

        const rows = getAllChatRows();
        const filteredChats = [];
        const seenIds = new Set();

        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length < 11) return;

            const specialistCell = cells[10];
            const specialistHtml = specialistCell.innerHTML;
            const specialists = parseSpecialists(specialistHtml);
            const uniqueSpecialists = getUniqueSpecialists(specialists);

            if (onlyOne && uniqueSpecialists.length !== 1) return;

            if (searchSurname) {
                let found = false;
                uniqueSpecialists.forEach(name => {
                    if (name.toLowerCase().includes(searchSurname)) found = true;
                });
                if (!found) return;
            }

            const chatIdCell = cells[0];
            const chatLink = chatIdCell.querySelector('a');
            const chatId = chatLink ? chatLink.textContent.trim() : 'N/A';

            if (seenIds.has(chatId)) return;
            seenIds.add(chatId);

            const problemCell = cells[8];
            const problem = problemCell ? problemCell.textContent.trim() : '';

            if (!matchesProblem(problem, problemFilter)) return;

            const rating = getChatRating(cells);

            if (selectedRating === 'no_rating' && rating !== null) return;
            if (selectedRating !== 'all' && selectedRating !== 'no_rating') {
                const ratingNum = parseInt(selectedRating);
                if (rating === null || rating !== ratingNum) return;
            }

            const timeCell = cells[2];
            const time = timeCell ? timeCell.textContent.trim() : 'N/A';
            const tagsCell = cells[9];
            const tags = tagsCell ? tagsCell.textContent.trim() : 'N/A';

            filteredChats.push({
                id: chatId,
                time: time,
                problem: problem,
                tags: tags,
                specialists: uniqueSpecialists,
                rating: rating,
                row: row,
                link: chatLink ? chatLink.href : '#'
            });
        });

        resultsContainer.style.display = 'flex';
        resultsList.innerHTML = '';

        if (filteredChats.length === 0) {
            resultsList.innerHTML = '<p class="app-empty">Чатов не найдено</p>';
            resultsCount.textContent = '0';
            return;
        }

        resultsCount.textContent = filteredChats.length;
        const ul = document.createElement('ul');
        ul.className = 'app-list';

        filteredChats.forEach(chat => {
            const li = document.createElement('li');
            li.className = 'app-card';
            const specialistNames = chat.specialists.join(', ');
            let ratingDisplay = '—';
            if (chat.rating) {
                const stars = '★'.repeat(chat.rating) + '☆'.repeat(5 - chat.rating);
                ratingDisplay = stars;
            }

            li.innerHTML = `
                <div class="app-card-header">
                    <div>
                        <span class="app-chat-id">#${chat.id}</span>
                        <span class="app-time"> • ${chat.time}</span>
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
            `;

            li.addEventListener('click', () => {
                if (chat.link && chat.link !== '#') window.open(chat.link, '_blank');
            });
            ul.appendChild(li);
        });

        resultsList.appendChild(ul);
    }

    function clearFilter() {
        document.getElementById('specialistSurname').value = '';
        document.getElementById('onlyOneSpecialist').checked = true;
        document.querySelectorAll('input[name="rating"]').forEach(radio => {
            if (radio.value === 'all') radio.checked = true;
        });
        document.getElementById('problemFilter').value = 'all';
        document.getElementById('resultsContainer').style.display = 'none';
        document.getElementById('resultsList').innerHTML = '';
    }

    button.addEventListener('click', () => {
        modal.style.display = 'flex';
        lockScroll();
        const surname = document.getElementById('specialistSurname').value;
        if (surname.trim() || document.getElementById('problemFilter').value !== 'all') {
            setTimeout(filterChats, 100);
        } else {
            document.getElementById('resultsContainer').style.display = 'none';
        }
    });

    document.getElementById('closeModalBtn').addEventListener('click', () => {
        modal.style.display = 'none';
        unlockScroll();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            modal.style.display = 'none';
            unlockScroll();
        }
    });

    document.getElementById('applyFilterBtn').addEventListener('click', filterChats);

    document.getElementById('clearFilterBtn').addEventListener('click', () => {
        clearFilter();
        const resultsContainer = document.getElementById('resultsContainer');
        resultsContainer.style.display = 'flex';
        const resultsList = document.getElementById('resultsList');
        resultsList.innerHTML = '<p class="app-empty">Фильтр очищен</p>';
        document.getElementById('resultsCount').textContent = '0';
    });

    document.getElementById('specialistSurname').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') filterChats();
    });

    document.getElementById('onlyOneSpecialist').addEventListener('change', filterChats);
    document.querySelectorAll('input[name="rating"]').forEach(radio => {
        radio.addEventListener('change', filterChats);
    });
    document.getElementById('problemFilter').addEventListener('change', filterChats);

    console.log('✅ Скрипт фильтрации чатов загружен (Native Green + Ubuntu)!');

})();