// ==UserScript==
// @name         Call Timeline Analyzer New 15.12.25
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Analyze call timelines with agent groups
// @author       Your Name
// @match        https://ai.sknt.ru/?cat=calls_records*
// @grant        GM_addStyle
// @updateURL    https://raw.githubusercontent.com/Sselenso/Scripts/main/Call_time.js
// @downloadURL  https://raw.githubusercontent.com/Sselenso/Scripts/main/Call_time.js
// ==/UserScript==

(function() {
    'use strict';

    // Стили для модального окна и элементов
    GM_addStyle(`
        .cta-analysis-modal {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90vw;
            height: 90vh;
            background: white;
            z-index: 10000;
            border-radius: 15px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            display: none;
            flex-direction: column;
            overflow: hidden;
            transition: opacity 0.3s ease;
        }

        .cta-modal-header {
            padding: 15px;
            background: #f5f5f5;
            border-bottom: 1px solid #ddd;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .cta-modal-content {
            flex: 1;
            overflow: auto;
            padding: 20px;
            position: relative;
            display: flex;
            flex-direction: column;
        }

        .cta-group-block {
            min-width: fit-content;
        }

        .cta-close-btn {
            cursor: pointer;
            font-size: 34px;
            padding: 0 10px;
            transition: color 0.3s ease;
        }

        .cta-close-btn:hover {
            color: #dc3545;
        }

        .cta-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 9999;
            display: none;
        }

        .cta-analysis-btn {
            position: fixed;
            top: 60px;
            right: 20px;
            z-index: 1000;
            padding: 10px 20px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            transition: background 0.3s ease;
        }

        .cta-analysis-btn:hover {
            background: #0056b3;
        }

        /* Стили групповых блоков */
        .cta-group-block {
            margin-bottom: 30px;
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
        }
        .cta-group-title {
            font-size: 16px;
            color: #333;
            margin: 0 0 15px 0;
            padding-bottom: 10px;
            border-bottom: 1px solid #ddd;
        }

        /* Стили временной шкалы */
        .cta-specialist-row {
            padding-bottom: 20px;
            margin-bottom: 10px;
            border-bottom: 1px solid #eee;
        }
        .cta-timeline {
            height: 20px;
            position: relative;
            background: #f0f0f0;
            margin-top: 10px;
            border-radius: 4px;
            overflow: hidden;
        }
        .cta-call-block {
            position: absolute;
            height: 20px;
            background: #2196F3;
            border-radius: 4px;
            padding: 5px;
            color: white;
            cursor: pointer;
            transition: transform 0.2s;
            box-sizing: border-box;
        }
        .cta-call-block:hover {
            transform: scaleY(1.1);
            z-index: 2;
        }
        .cta-specialist-name {
            font-size: 14px;
            font-weight: bold;
            color: #333;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .cta-time-axis-container {
            position: sticky;
            bottom: 0;
            background: white;
            z-index: 1000;
            padding: 10px 0;
            border-top: 1px solid #eee;
            margin-top: 20px;
        }

        .cta-time-axis {
            height: 20px;
            position: relative;
            padding: 5px 0;
            margin: 0 20px;
        }

        .cta-time-label {
            position: absolute;
            transform: translateX(-50%);
            font-size: 12px;
            color: #666;
            white-space: nowrap;
        }

        .cta-agent-color-badge {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            display: inline-block;
        }
        .cta-tooltip {
            position: fixed;
            background: rgba(0,0,0,0.9);
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 13px;
            z-index: 9999;
            pointer-events: none;
            white-space: nowrap;
            backdrop-filter: blur(2px);
            display: none;
        }
        .cta-loader {
            display: none;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            border: 4px solid #f3f3f3;
            border-top: 4px solid #0d6efd;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: cta-spin 1s linear infinite;
        }
        @keyframes cta-spin {
            0% { transform: translate(-50%, -50%) rotate(0deg); }
            100% { transform: translate(-50%, -50%) rotate(360deg); }
        }

        .filter-section {
            margin-bottom: 20px;
            display: flex;
            gap: 15px;
            padding: 15px;
            background: #f5f5f5;
            border-bottom: 1px solid #ddd;
            flex-wrap: wrap;
        }

        .filter-section label {
            display: flex;
            align-items: center;
            gap: 5px;
            cursor: pointer;
        }

        .cta-call-info {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
            padding-left: 20px;
        }
    `);

    // Создаем элементы интерфейса
    const modal = document.createElement('div');
    modal.className = 'cta-analysis-modal';
    modal.innerHTML = `
        <div class="cta-modal-header">
            <h3>Анализ звонков</h3>
            <span class="cta-close-btn">&times;</span>
        </div>
        <div class="filter-section">
            <label>
                <input type="checkbox" id="filter-sl1" checked> SL1
            </label>
            <label>
                <input type="checkbox" id="filter-sl2" checked> SL2
            </label>
            <label>
                <input type="checkbox" id="filter-vks" checked> ВКЦ
            </label>
            <label>
                <input type="checkbox" id="filter-country" checked> Кантри
            </label>
        </div>
        <div class="cta-modal-content">
            <div class="cta-loader"></div>
        </div>
    `;

    const overlay = document.createElement('div');
    overlay.className = 'cta-modal-overlay';

    const button = document.createElement('button');
    button.className = 'cta-analysis-btn';
    button.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
        </svg>
        Анализ звонков
    `;

    document.body.append(button, modal, overlay);

    // Обработчики событий
    button.addEventListener('click', async () => {
        modal.style.display = 'flex';
        overlay.style.display = 'block';
        setTimeout(() => modal.style.opacity = '1', 10);
        showLoader();
        try {
            await updateModalContent();
        } catch (error) {
            showError(error);
        } finally {
            hideLoader();
        }
    });

    modal.querySelector('.cta-close-btn').addEventListener('click', () => {
        modal.style.opacity = '0';
        overlay.style.display = 'none';
        setTimeout(() => modal.style.display = 'none', 300);
    });

    overlay.addEventListener('click', () => {
        modal.style.opacity = '0';
        overlay.style.display = 'none';
        setTimeout(() => modal.style.display = 'none', 300);
    });

    // Основные функции
    async function updateModalContent() {
        const calls = await fetchCallData();
        const groupedCalls = groupCallsIntoCategories(calls);
        const filteredCalls = Object.values(groupedCalls)
            .flatMap(group => Object.values(group).flatMap(agent => agent.calls));

        if (filteredCalls.length === 0) throw new Error('Нет данных для отображения');

        const { timelineStart, timelineEnd } = calculateTimeBoundaries(filteredCalls);
        const content = modal.querySelector('.cta-modal-content');
        content.innerHTML = createTimelineHTML(groupedCalls, timelineStart, timelineEnd);

        addEventListenersToCallBlocks();
        renderTimeAxis(timelineStart, timelineEnd);
    }

    function groupCallsIntoCategories(calls) {
        const groups = { sl1: {}, sl2: {}, vks: {}, country: {} };

        calls.forEach(call => {
            const agentId = parseInt(call.agent, 10);
            let group;

            if (agentId >= 300 && agentId <= 400) group = 'country';
            else if (agentId >= 1100 && agentId <= 1200) group = 'sl1';
            else if (agentId > 1200 && agentId <= 1300) group = 'sl2';
            else if (agentId >= 1500 && agentId <= 1600) group = 'vks';
            else return;

            if (!groups[group][call.agent]) {
                groups[group][call.agent] = {
                    agent: call.agent,
                    agentName: call.agentName,
                    calls: []
                };
            }
            groups[group][call.agent].calls.push(call);
        });

        // Удаляем пустые группы
        Object.keys(groups).forEach(g => {
            if (Object.keys(groups[g]).length === 0) delete groups[g];
        });

        return groups;
    }

    function createTimelineHTML(groupedCalls, start, end) {
        const groupTemplates = {
            sl1: { title: 'SL1' },
            sl2: { title: 'SL2' },
            vks: { title: 'ВКЦ' },
            country: { title: 'Кантри' }
        };

        const filterSl1 = document.getElementById('filter-sl1')?.checked ?? true;
        const filterSl2 = document.getElementById('filter-sl2')?.checked ?? true;
        const filterVks = document.getElementById('filter-vks')?.checked ?? true;
        const filterCountry = document.getElementById('filter-country')?.checked ?? true;

        return Object.entries(groupedCalls).map(([group, agents]) => {
            if ((group === 'sl1' && filterSl1) ||
                (group === 'sl2' && filterSl2) ||
                (group === 'vks' && filterVks) ||
                (group === 'country' && filterCountry)) {

                // Сортируем агентов по фамилии
                const sortedAgents = Object.values(agents).sort((a, b) => {
                    const lastNameA = a.agentName.split(' ').pop();
                    const lastNameB = b.agentName.split(' ').pop();
                    return lastNameA.localeCompare(lastNameB);
                });

                return `
                    <div class="cta-group-block">
                        <h4 class="cta-group-title">${groupTemplates[group].title}</h4>
                        ${sortedAgents.map(agent => createAgentHTML(agent, start, end, group)).join('')}
                    </div>
                `;
            }
            return '';
        }).join('');
    }

    function createAgentHTML(agent, start, end, group) {
        const totalDuration = agent.calls.reduce((sum, call) => sum + call.duration, 0);

        // Сортируем звонки по времени начала
        const sortedCalls = [...agent.calls].sort((a, b) => a.startTime - b.startTime);

        return `
            <div class="cta-specialist-row">
                <div class="cta-specialist-name">
                    <span class="cta-agent-color-badge" style="background:${getAgentColor(agent.agent)}"></span>
                    ${agent.agentName} (${agent.calls.length} ${getCallWordEnding(agent.calls.length)}, ${formatDuration(totalDuration)})
                </div>
                <div class="cta-timeline">
                    ${sortedCalls.map(call => createCallBlockHTML(call, start, end)).join('')}
                </div>
            </div>
        `;
    }

    function createCallBlockHTML(call, start, end) {
        const position = calculatePosition(call.startTime, start, end);
        const width = calculateWidth(call.duration, start, end);

        return `
            <div class="cta-call-block"
                 style="left:${position}%; width:${Math.max(width, 0.5)}%; background:${getAgentColor(call.agent)}"
                 data-start="${call.startTime.toISOString()}"
                 data-end="${call.endTime.toISOString()}"
                 data-duration="${call.duration}"
                 data-agent="${call.agent}"
                 data-agent-name="${call.agentName}">
            </div>
        `;
    }

    // Функции для работы с данными
    function fetchCallData() {
        return new Promise((resolve, reject) => {
            try {
                // ИСПРАВЛЕННЫЙ СЕЛЕКТОР для строк таблицы
                const rows = document.querySelectorAll('.tb84fc3.r4d22b2');
                if (rows.length === 0) throw new Error('Не найдено данных о звонках');

                const calls = Array.from(rows).map(row => {
                    // ИСПРАВЛЕННЫЙ СЕЛЕКТОР для ячеек
                    const cells = row.querySelectorAll('.t963da6.c0d3473.m8ada7a');
                    return parseCallData(cells);
                });

                resolve(calls);
            } catch (error) {
                reject(error);
            }
        });
    }

    function parseCallData(cells) {
        // Индексы для новой структуры таблицы:
        // 0: ID звонка
        // 1: ID клиента
        // 2: Тип вызова
        // 3: Дата и время начала (НОВОЕ МЕСТО!)
        // 4: Агент (НОВОЕ МЕСТО!)
        // 5: Телефон
        // 6: Длительность (НОВОЕ МЕСТО!)
        // 7: Аудио
        // 8: Действия

        if (cells.length < 7) {
            return {
                agent: 'Неизвестный',
                agentName: 'Неизвестный агент',
                startTime: new Date(),
                endTime: new Date(),
                duration: 0
            };
        }

        const agentMatch = cells[4].textContent.match(/(\d+)/);
        const agent = agentMatch ? agentMatch[0] : 'Неизвестный';

        const agentNameMatch = cells[4].textContent.match(/\(([^)]*)\)/);
        let agentName = agentNameMatch && agentNameMatch[1].trim()
            ? agentNameMatch[1].trim()
            : `Специалист ${agent}`;

        // ИСПРАВЛЕННЫЙ ИНДЕКС для времени начала
        const startTime = parseDate(cells[3].textContent.trim());

        // ИСПРАВЛЕННЫЙ ИНДЕКС для длительности
        const duration = parseDuration(cells[6].textContent.trim());

        return {
            agent,
            agentName,
            startTime,
            endTime: new Date(startTime.getTime() + duration * 1000),
            duration
        };
    }

    function parseDate(dateString) {
        try {
            // Формат: "08.12.2025 23:58:02"
            const [date, time] = dateString.split(' ');
            const [day, month, year] = date.split('.').map(Number);
            const [hours, minutes, seconds] = time.split(':').map(Number);
            return new Date(year, month - 1, day, hours, minutes, seconds);
        } catch (error) {
            console.error('Ошибка парсинга даты:', dateString, error);
            return new Date();
        }
    }

    function parseDuration(duration) {
        try {
            // Формат: "01:41"
            const [minutes, seconds] = duration.split(':').map(Number);
            return minutes * 60 + (seconds || 0);
        } catch (error) {
            console.error('Ошибка парсинга длительности:', duration, error);
            return 0;
        }
    }

    function calculateTimeBoundaries(calls) {
        const startTimes = calls.map(c => c.startTime.getTime());
        const endTimes = calls.map(c => c.endTime.getTime());
        const timelineStart = new Date(Math.min(...startTimes));
        const timelineEnd = new Date(Math.max(...endTimes));

        // Добавляем небольшие отступы по краям
        timelineStart.setMinutes(timelineStart.getMinutes() - 5);
        timelineEnd.setMinutes(timelineEnd.getMinutes() + 5);

        return { timelineStart, timelineEnd };
    }

    function calculatePosition(startTime, timelineStart, timelineEnd) {
        const total = timelineEnd - timelineStart;
        const position = startTime - timelineStart;
        return (position / total) * 100;
    }

    function calculateWidth(duration, timelineStart, timelineEnd) {
        const total = timelineEnd - timelineStart;
        return (duration * 1000 / total) * 100;
    }

    function addEventListenersToCallBlocks() {
        const content = modal.querySelector('.cta-modal-content');
        const tooltip = document.createElement('div');
        tooltip.className = 'cta-tooltip';
        content.appendChild(tooltip);

        document.querySelectorAll('.cta-call-block').forEach(block => {
            block.addEventListener('mouseenter', (e) => {
                tooltip.innerHTML = `
                    <strong>${block.dataset.agentName}</strong><br>
                    ID: ${block.dataset.agent}<br>
                    Начало: ${formatTime(new Date(block.dataset.start))}<br>
                    Конец: ${formatTime(new Date(block.dataset.end))}<br>
                    Длительность: ${formatDuration(parseInt(block.dataset.duration))}
                `;
                tooltip.style.display = 'block';
            });

            block.addEventListener('mousemove', (e) => {
                tooltip.style.left = (e.clientX + 1) + 'px';
                tooltip.style.top = (e.clientY + 1) + 'px';
            });

            block.addEventListener('mouseleave', () => {
                tooltip.style.display = 'none';
            });

            block.addEventListener('click', () => {
                console.log('Данные звонка:', {
                    agent: block.dataset.agent,
                    agentName: block.dataset.agentName,
                    start: block.dataset.start,
                    end: block.dataset.end,
                    duration: block.dataset.duration
                });
            });
        });
    }

    function renderTimeAxis(start, end) {
        const content = modal.querySelector('.cta-modal-content');
        const axisContainer = document.createElement('div');
        axisContainer.className = 'cta-time-axis-container';

        const axis = document.createElement('div');
        axis.className = 'cta-time-axis';
        axisContainer.appendChild(axis);

        const total = end - start;
        const steps = calculateOptimalSteps(total);

        for (let i = 0; i <= steps; i++) {
            const time = new Date(start.getTime() + (total * i / steps));
            const label = document.createElement('div');
            label.className = 'cta-time-label';
            label.style.left = `${(i / steps) * 100}%`;
            label.textContent = formatTime(time);
            axis.appendChild(label);
        }

        content.appendChild(axisContainer);
    }

    function formatTime(date) {
        return date.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }

    function formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (mins > 0) {
            return `${mins} мин ${secs.toString().padStart(2, '0')} сек`;
        }
        return `${secs} сек`;
    }

    function getCallWordEnding(count) {
        const cases = [2, 0, 1, 1, 1, 2];
        const words = ['звонок', 'звонка', 'звонков'];
        return words[(count % 100 > 4 && count % 100 < 20) ? 2 : cases[Math.min(count % 10, 5)]];
    }

    function calculateOptimalSteps(totalDuration) {
        const hours = totalDuration / 3600000;
        if (hours <= 1) return 6;
        if (hours <= 3) return 8;
        if (hours <= 6) return 10;
        return 12;
    }

    function getAgentColor(agentId) {
        const colors = [
            '#4567b7', // Синий
            '#d81b60', // Розовый
            '#2e7d32', // Зеленый
            '#5e35b1', // Фиолетовый
            '#e53935', // Красный
            '#00897b', // Бирюзовый
            '#3f51b5', // Индиго
            '#ad1457', // Пурпурный
            '#388e3c', // Темно-зеленый
            '#7e57c2', // Фиолетовый
            '#ba68c8', // Лавандовый
            '#ff7043', // Лососевый
        ];

        const idNum = parseInt(agentId, 10);
        return colors[idNum % colors.length];
    }

    function showLoader() {
        const loader = modal.querySelector('.cta-loader');
        if (loader) loader.style.display = 'block';
    }

    function hideLoader() {
        const loader = modal.querySelector('.cta-loader');
        if (loader) loader.style.display = 'none';
    }

    function showError(message) {
        const content = modal.querySelector('.cta-modal-content');
        content.innerHTML = `
            <div style="text-align:center; padding:40px; color:#dc3545;">
                <h4>Ошибка загрузки данных</h4>
                <p>${message}</p>
                <button onclick="location.reload()" style="margin-top:20px; padding:10px 20px; background:#007bff; color:white; border:none; border-radius:5px; cursor:pointer;">
                    Обновить страницу
                </button>
            </div>
        `;
    }

    // Инициализация фильтров
    function initFilters() {
        const filterCheckboxes = document.querySelectorAll('.filter-section input[type="checkbox"]');
        filterCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', async () => {
                showLoader();
                try {
                    await updateModalContent();
                } catch (error) {
                    showError(error);
                } finally {
                    hideLoader();
                }
            });
        });
    }

    // Инициализация при загрузке страницы
    setTimeout(() => {
        initFilters();
    }, 1000);
})();