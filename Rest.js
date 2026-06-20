// ==UserScript==
// @name         Анализ перерывов новая логика
// @namespace    http://tampermonkey.net/
// @version      6.1
// @description  Исправлены цвета и убрана лишняя информация + улучшенный поиск текста
// @match        https://ai.sknt.ru/monitoring_cc
// @grant        none
// @updateURL    https://raw.githubusercontent.com/Sselenso/Scripts/main/Rest.js
// @downloadURL  https://raw.githubusercontent.com/Sselenso/Scripts/main/Rest.js
// ==/UserScript==

(function() {
    'use strict';

    // ========== СТИЛИ ==========
    const STYLES = `
        .break-panel-wrapper {
            margin-top: 20px;
            grid-column: 1 / -1;
            width: 100%;
        }

        .break-panel {
            background: var(--color-bg-primary, #FFFFFF);
            color: var(--color-text-primary, #212121);
            border: 1px solid var(--color-border, #E0E0E0);
            font-size: 14px;
            width: 100%;
        }

        .break-panel-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 12px;
            border-bottom: 1px solid var(--color-border, #E0E0E0);
            background-color: #58676e !important;
            padding: 6px 14px;
        }

        .break-panel-title {
            font-size: 16px;
            font-weight: 600;
            color: var(--color-text-invert);
        }

        .break-panel-controls {
            display: flex;
            gap: 8px;
            align-items: center;
        }

        .break-timestamp {
            font-size: 12px;
            color: var(--color-text-secondary, #616161);
            background: var(--color-bg-secondary, #F5F5F5);
            padding: 4px 12px;
            border-radius: 4px;
            border: 1px solid var(--color-border, #E0E0E0);
        }

        .break-settings-btn {
            cursor: pointer;
            font-size: 16px;
            color: var(--color-text-secondary, #616161);
            padding: 4px 8px;
            border-radius: 4px;
            transition: background 0.2s;
        }

        .break-settings-btn:hover {
            background: var(--color-bg-secondary, #F5F5F5);
        }

        .break-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        }

        .break-card {
            padding: 14px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }

        .break-card-queue-0 {
            background: #FFFFFF;
        }

        .break-card-queue-5 {
            background: #FFF8E1;
        }

        .break-card-queue-10 {
            background: #FFEBEE;
        }

        .break-card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 10px;
        }

        .break-card-name {
            font-size: 16px;
            font-weight: 600;
            color: var(--color-text-primary, #212121);
        }

        .break-card-badge {
            background: #2196F3;
            color: #fff;
            padding: 4px 12px;
            border-radius: 4px;
            font-weight: 600;
        }

        .break-stats {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 6px;
            margin-bottom: 10px;
            padding: 8px;
            background: var(--color-bg-secondary, #F5F5F5);
            border-radius: 4px;
        }

        .break-stat-item {
            text-align: center;
            color: var(--color-text-secondary, #616161);
        }

        .break-stat-value {
            font-weight: 600;
            color: var(--color-text-primary, #212121);
        }

        .break-stat-value-green {
            color: #4CAF50;
        }

        .break-stat-value-red {
            color: #F44336;
        }

        .break-action {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6px 10px;
            border-radius: 4px;
            font-weight: 500;
        }

        .break-action-optimal {
            background: #bbf7d0;
						color: #2E7D32;
						border-color: #2E7D32;;
        }

        .break-action-warning {
            background: #FF9800;
            color: #F57C00;
            border: 1px solid #F57C00;
        }

        .break-action-danger {
            background: #F44336;
            color: #D32F2F;
            border: 1px solid #D32F2F;
        }

        .break-action-text {
            flex: 1;
						font-weight: 700;
        }

        .break-action-sub {
            font-size: 14px;
            opacity: 0.8;
        }

        .break-footer {
            padding: 6px 14px;
            border-top: 1px solid var(--color-border, #E0E0E0);
            display: flex;
            justify-content: space-between;
            color: var(--color-text-secondary, #616161);
            font-size: 13px;
            flex-wrap: wrap;
            gap: 6px;
        }

        .break-footer-item {
            padding: 4px 12px;
            border-radius: 4px;
            border: 1px solid transparent;
        }

        .break-footer-free {
            background: #E8F5E9;
            color: #2E7D32;
            border-color: #4CAF50;
        }

        .break-footer-short {
            background: #FFF8E1;
            color: #5D4037;
            border-color: #FFC107;
        }

        .break-footer-offline {
            background: #FFEBEE;
            color: #C62828;
            border-color: #F44336;
        }

        .break-footer-busy {
            background: #FFF3E0;
            color: #E65100;
            border-color: #FF9800;
        }

        .break-footer-total {
            background: #E3F2FD;
            color: #1565C0;
            border-color: #2196F3;
        }

        .break-loading {
            text-align: center;
            color: var(--color-text-secondary, #666);
            padding: 20px;
        }

        .break-error {
            color: #F44336;
            text-align: center;
            padding: 20px;
        }

        .break-hidden {
            display: none;
        }

        /* Модальное окно */
        .break-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.3);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .break-modal {
            background: #FFFFFF;
            color: #212121;
            padding: 0;
            border-radius: 4px;
            max-width: 560px;
            width: 90%;
            max-height: 85vh;
            overflow-y: auto;
            border: 1px solid #E0E0E0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }

        .break-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 20px;
            background: #58676e !important;
            border-bottom: 1px solid #E0E0E0;
        }

        .break-modal-title {
            margin: 0;
            color: #ffffff;
            font-size: 16px;
            font-weight: 600;
        }

        .break-modal-close {
            font-size: 22px;
            cursor: pointer;
            color: #ffffff;
            line-height: 1;
            opacity: 0.8;
            transition: opacity 0.2s;
        }

        .break-modal-close:hover {
            opacity: 1;
        }

        .break-modal-body {
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 14px;
        }

        .break-modal-label {
            display: block;
            margin-bottom: 4px;
            color: #212121;
            font-weight: 500;
            font-size: 13px;
        }

        .break-modal-description {
            display: block;
            margin-bottom: 8px;
            color: #757575;
            font-size: 12px;
            font-style: italic;
        }

        .break-modal-input {
            width: 100%;
            padding: 8px 12px;
            background: #FFFFFF;
            border: 1px solid #D0D0D0;
            color: #212121;
            border-radius: 4px;
            font-size: 14px;
            box-sizing: border-box;
            transition: border-color 0.2s;
        }

        .break-modal-input:focus {
            border-color: #2196F3;
            outline: none;
        }

        .break-modal-input-sm {
            width: 80px;
            margin-left: 10px;
            padding: 6px 8px;
            background: #FFFFFF;
            border: 1px solid #D0D0D0;
            color: #212121;
            border-radius: 4px;
            font-size: 14px;
            transition: border-color 0.2s;
        }

        .break-modal-input-sm:focus {
            border-color: #2196F3;
            outline: none;
        }

        .break-modal-fieldset {
            border: 1px solid #E0E0E0;
            border-radius: 4px;
            padding: 12px 14px;
            margin: 0;
        }

        .break-modal-legend {
            color: #616161;
            padding: 0 8px;
            font-size: 13px;
            font-weight: 500;
        }

        .break-modal-field {
            display: block;
            margin-bottom: 10px;
            font-size: 13px;
            color: #212121;
        }

        .break-modal-field:last-child {
            margin-bottom: 0;
        }

        .break-modal-actions {
            display: flex;
            gap: 10px;
            margin-top: 8px;
            padding-top: 14px;
            border-top: 1px solid #E0E0E0;
        }

        .break-modal-btn {
            padding: 8px 20px;
            border-radius: 4px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            border: 1px solid transparent;
            font-size: 14px;
        }

        .break-modal-btn-save {
            flex: 2;
            background: #2196F3;
            color: #fff;
            border-color: #1976D2;
        }

        .break-modal-btn-save:hover {
            background: #1976D2;
        }

        .break-modal-btn-reset {
            flex: 1;
            background: #9E9E9E;
            color: #fff;
            border-color: #757575;
        }

        .break-modal-btn-reset:hover {
            background: #757575;
        }

        .break-modal-btn-cancel {
            flex: 1;
            background: #F5F5F5;
            color: #212121;
            border-color: #D0D0D0;
        }

        .break-modal-btn-cancel:hover {
            background: #E0E0E0;
        }
    `;

    // ========== ДОБАВЛЕНИЕ СТИЛЕЙ ==========
    function addStyles() {
        if (document.getElementById('break-advisor-styles')) return;

        const styleEl = document.createElement('style');
        styleEl.id = 'break-advisor-styles';
        styleEl.textContent = STYLES;
        document.head.appendChild(styleEl);
    }

    // ========== НАСТРОЙКИ ==========
    const DEFAULT_CONFIG = {
        freeReadyThreshold: 60,
        targetGroups: ['AO', 'ТехПо'],
        reserveForQueue: 5,
        maxBreakQueue1to5: 3,
        maxBreakQueue6to10: 2,
        maxBreakQueue10plus: 1,
        ignoreQueueIfFree: 5
    };

    let CONFIG = loadConfig();

    function loadConfig() {
        try {
            const saved = localStorage.getItem('breakAdvisorConfig');
            if (saved) {
                const parsed = JSON.parse(saved);
                return { ...DEFAULT_CONFIG, ...parsed };
            }
        } catch (e) {
            console.error('❌ [BreakAdvisor] Ошибка загрузки настроек:', e);
        }
        return { ...DEFAULT_CONFIG };
    }

    function saveConfig() {
        try {
            localStorage.setItem('breakAdvisorConfig', JSON.stringify(CONFIG));
        } catch (e) {
            console.error('❌ [BreakAdvisor] Ошибка сохранения:', e);
        }
    }

    // ========== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ==========
    const UPDATE_INTERVAL = 15000;
    let settingsModal = null;
    let panelWrapper = null;
    let panel = null;

    // ========== УЛУЧШЕННАЯ ФУНКЦИЯ ПРОВЕРКИ СТРАНИЦЫ ==========
    function isTargetPage() {
        // Получаем весь текст страницы
        const bodyText = document.body?.innerText || '';
        const htmlText = document.documentElement?.innerText || '';

        // Варианты текста для поиска (с учетом разных пробелов и переносов)
        const searchPatterns = [
            'Мониторинг КЦ Статистика входящих звонков Вся статистика',
            'Мониторинг КЦ Статистика входящих звонков',
            'Статистика входящих звонков Вся статистика',
            'Мониторинг КЦ'
        ];

        // Проверяем наличие любого из паттернов
        for (const pattern of searchPatterns) {
            // Убираем лишние пробелы для сравнения
            const normalizedBody = bodyText.replace(/\s+/g, ' ').trim();
            const normalizedHtml = htmlText.replace(/\s+/g, ' ').trim();
            const normalizedPattern = pattern.replace(/\s+/g, ' ').trim();

            if (normalizedBody.includes(normalizedPattern) || normalizedHtml.includes(normalizedPattern)) {                
                return true;
            }
        }

        return false;
    }

    // ========== ПОИСК КОНТЕЙНЕРА ДЛЯ ВСТАВКИ ==========
    function findInsertPosition() {
        const containers = document.querySelectorAll('.grid.gap-4.w-1\\/2');
        if (containers.length >= 2) {
            return containers[1];
        }
        return null;
    }

    // ========== СОЗДАНИЕ ПАНЕЛИ ==========
    function createPanel() {
        if (panelWrapper) {
            panelWrapper.remove();
            panelWrapper = null;
            panel = null;
        }

        const targetContainer = findInsertPosition();

        if (!targetContainer) {
            return false;
        }

        const existingPanel = targetContainer.querySelector('#break-advisor-panel');
        if (existingPanel) {
            const wrapper = existingPanel.closest('.break-panel-wrapper');
            if (wrapper) {
                wrapper.remove();
            }
        }

        panelWrapper = document.createElement('div');
        panelWrapper.className = 'break-panel-wrapper';

        panel = document.createElement('div');
        panel.id = 'break-advisor-panel';
        panel.className = 'break-panel';
        panel.innerHTML = '<div class="break-loading">⏳ Загрузка данных...</div>';

        panelWrapper.appendChild(panel);
        targetContainer.appendChild(panelWrapper);

        return true;
    }

    // ========== УТИЛИТЫ ==========
    function parseTimeToSeconds(str) {
        str = str.trim();
        if (str === '-' || str === '–') return 0;
        let total = 0;
        const parts = str.split(' ');
        for (let i = 0; i < parts.length; i += 2) {
            const val = parseInt(parts[i], 10);
            if (isNaN(val)) continue;
            const unit = parts[i + 1] || '';
            if (unit.includes('мин')) total += val * 60;
            else if (unit.includes('сек')) total += val;
        }
        return total;
    }

    // ========== ПАРСИНГ ДАННЫХ ==========
    function parseData() {
        const tables = document.querySelectorAll('table._table_g86u9_1');

        if (tables.length < 2) {
            return null;
        }

        const summaryTable = tables[0];
        const detailTable = tables[1];

        const groupMetrics = {};

        summaryTable.querySelectorAll('tr').forEach((row, rowIndex) => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 2) {
                const name = cells[0].innerText.trim();
                const queueRaw = cells[1].innerText.trim();
                const queue = parseInt(queueRaw, 10);

                if (name && !isNaN(queue)) {
                    groupMetrics[name] = { queue };
                } else {
                    console.warn(`⚠️ [BreakAdvisor] Пропущено: name="${name}", queue=${queue}`);
                }
            }
        });

        const groups = {};
        let currentGroup = null;

        detailTable.querySelectorAll('tr').forEach(row => {
            const header = row.querySelector('td[colspan="5"]');
            if (header) {
                const rawText = header.innerText.trim().replace(/<!---->/g, '');
                currentGroup = rawText
                    .replace(/\s*Статистика\s*/g, '')
                    .trim();

                if (currentGroup.includes('Статистика')) {
                    currentGroup = null;
                    return;
                }

                if (!groups[currentGroup]) {
                    groups[currentGroup] = { total: 0, freeReady: 0, freeShort: 0, busy: 0, offline: 0, ringing: 0 };
                }
                return;
            }

            if (currentGroup && row.cells.length >= 5) {
                const cells = row.cells;
                const statusCell = cells[2];
                let statusText = '';
                const statusDiv = statusCell.querySelector('.flex.gap-8');
                if (statusDiv) {
                    const textNodes = Array.from(statusDiv.childNodes).filter(n => n.nodeType === Node.TEXT_NODE);
                    statusText = textNodes.length ? textNodes[0].textContent.trim() : statusDiv.innerText.trim();
                } else {
                    statusText = statusCell.innerText.trim();
                }

                const timeText = cells[3]?.innerText.trim() || '-';
                const timeSec = parseTimeToSeconds(timeText);
                const g = groups[currentGroup];
                g.total++;

                if (statusText.includes('Свободен')) {
                    if (timeSec > CONFIG.freeReadyThreshold) g.freeReady++;
                    else g.freeShort++;
                } else if (statusText.includes('Разговаривает')) {
                    g.busy++;
                } else if (statusText.includes('Выключен')) {
                    g.offline++;
                } else if (statusText.includes('Недоступен')) {
                    g.offline++;
                } else if (statusText.includes('Идет звонок')) {
                    g.ringing++;
                }
            }
        });

        for (const group in groups) {
            groups[group].queue = groupMetrics[group]?.queue ?? 0;
        }

        return groups;
    }

    // ========== АНАЛИЗ ==========
    function analyze(groups) {
        if (!groups) {
            return null;
        }

        const result = {
            timestamp: Date.now(),
            groups: {},
            overall: { freeReady: 0, freeShort: 0, offline: 0, busy: 0, total: 0 }
        };

        const {
            reserveForQueue,
            maxBreakQueue1to5,
            maxBreakQueue6to10,
            maxBreakQueue10plus,
            ignoreQueueIfFree
        } = CONFIG;

        for (const [name, data] of Object.entries(groups)) {
            if (!CONFIG.targetGroups.includes(name)) {
                continue;
            }

            const queue = data.queue;
            const freeReady = data.freeReady;
            const offline = data.offline;

            let effectiveQueue = queue;

            if (freeReady > 0 && queue <= ignoreQueueIfFree) {
                effectiveQueue = 0;
            }

            let maxAllowed = 0;
            let canRelease = 0;
            let action = '';
            let actionClass = '';
            let queueRange = '';

            if (effectiveQueue === 0) {
                canRelease = Math.max(0, freeReady - reserveForQueue);
                queueRange = '0';
                maxAllowed = canRelease;

                if (canRelease > 0) {
                    action = `🔺 Можно отпустить ${canRelease}`;
                    actionClass = 'break-action-optimal';
                } else {
                    action = '✅ Оптимально';
                    actionClass = 'break-action-optimal';
                }

            } else if (effectiveQueue >= 1 && effectiveQueue <= 5) {
                maxAllowed = maxBreakQueue1to5;
                queueRange = '0-5';

                if (offline === maxAllowed) {
                    action = '✅ Оптимально';
                    actionClass = 'break-action-optimal';
                } else if (offline < maxAllowed) {
                    const need = maxAllowed - offline;
                    action = `🔺 Отпустить ${need} (до ${maxAllowed})`;
                    actionClass = 'break-action-optimal';
                } else {
                    const excess = offline - maxAllowed;
                    if (excess <= 2) {
                        action = `🔻 Вернуть ${excess} (до ${maxAllowed})`;
                        actionClass = 'break-action-warning';
                    } else {
                        action = `🔻 Вернуть ${excess} (до ${maxAllowed})`;
                        actionClass = 'break-action-danger';
                    }
                }

            } else if (effectiveQueue >= 6 && effectiveQueue <= 10) {
                maxAllowed = maxBreakQueue6to10;
                queueRange = '6-10';

                if (offline === maxAllowed) {
                    action = '✅ Оптимально';
                    actionClass = 'break-action-optimal';
                } else if (offline < maxAllowed) {
                    const need = maxAllowed - offline;
                    action = `🔺 Отпустить ${need} (до ${maxAllowed})`;
                    actionClass = 'break-action-optimal';
                } else {
                    const excess = offline - maxAllowed;
                    if (excess <= 2) {
                        action = `🔻 Вернуть ${excess} (до ${maxAllowed})`;
                        actionClass = 'break-action-warning';
                    } else {
                        action = `🔻 Вернуть ${excess} (до ${maxAllowed})`;
                        actionClass = 'break-action-danger';
                    }
                }

            } else {
                maxAllowed = maxBreakQueue10plus;
                queueRange = '10+';

                if (offline === maxAllowed) {
                    action = '✅ Оптимально';
                    actionClass = 'break-action-optimal';
                } else if (offline < maxAllowed) {
                    const need = maxAllowed - offline;
                    action = `🔺 Отпустить ${need} (до ${maxAllowed})`;
                    actionClass = 'break-action-optimal';
                } else {
                    const excess = offline - maxAllowed;
                    if (excess <= 2) {
                        action = `🔻 Вернуть ${excess} (до ${maxAllowed})`;
                        actionClass = 'break-action-warning';
                    } else {
                        action = `🔻 Вернуть ${excess} (до ${maxAllowed})`;
                        actionClass = 'break-action-danger';
                    }
                }
            }

            result.groups[name] = {
                queue,
                effectiveQueue,
                queueRange,
                freeReady,
                freeShort: data.freeShort,
                busy: data.busy,
                offline,
                total: data.total,
                maxAllowed,
                canRelease,
                action,
                actionClass
            };

            result.overall.freeReady += freeReady;
            result.overall.freeShort += data.freeShort;
            result.overall.offline += offline;
            result.overall.busy += data.busy;
            result.overall.total += data.total;
        }

        return result;
    }

    // ========== ОТРИСОВКА ПАНЕЛИ ==========
    function renderPanel(analysis) {
        if (!analysis || !panel) {
            if (panel) {
                panel.innerHTML = `<div class="break-error">❌ Нет данных для анализа</div>`;
            }
            return;
        }

        const timeStr = new Date(analysis.timestamp).toLocaleTimeString('ru-RU');

        let html = `
            <div class="break-panel-header">
                <span class="break-panel-title">Анализ перерывов</span>
                <div class="break-panel-controls">
                    <span class="break-timestamp">🔄 ${timeStr}</span>
                    <span id="settings-button" class="break-settings-btn" title="Настройки">⚙️</span>
                </div>
            </div>
            <div class="break-grid">
        `;

        for (const [name, g] of Object.entries(analysis.groups)) {
            let cardClass = 'break-card break-card-queue-0';
            if (g.queue >= 10) {
                cardClass = 'break-card break-card-queue-10';
            } else if (g.queue >= 5) {
                cardClass = 'break-card break-card-queue-5';
            }

            let targetText;
            if (g.effectiveQueue === 0) {
                if (g.canRelease > 0) {
                    targetText = g.offline + g.canRelease;
                } else {
                    targetText = CONFIG.maxBreakQueue1to5;
                }
            } else {
                targetText = g.maxAllowed;
            }

            html += `
                <div class="${cardClass}">
                    <div class="break-card-header">
                        <span class="break-card-name">${name}</span>
                        <span class="break-card-badge">🎯 ${targetText}</span>
                    </div>
                    <div class="break-stats">
                        <div class="break-stat-item">
                            <div class="break-stat-value">${g.queue}</div>
                            Очередь
                        </div>
                        <div class="break-stat-item">
                            <div class="break-stat-value break-stat-value-green">${g.freeReady}</div>
                            Свободны
                        </div>
                        <div class="break-stat-item">
                            <div class="break-stat-value break-stat-value-red">${g.offline}</div>
                            Перерыв
                        </div>
                    </div>
                    <div class="break-action ${g.actionClass}">
                        <span class="break-action-text">${g.action}</span>
                        <span class="break-action-sub">${g.busy} разговаривает</span>
                    </div>
                </div>
            `;
        }

        html += `</div>`;

        html += `
            <div class="break-footer">
                <span class="break-footer-item break-footer-free">🟢 Свободен: ${analysis.overall.freeReady}</span>
                <span class="break-footer-item break-footer-short">🟡 Ожид: ${analysis.overall.freeShort}</span>
                <span class="break-footer-item break-footer-offline">🔴 Перер: ${analysis.overall.offline}</span>
                <span class="break-footer-item break-footer-busy">🟠 Разг: ${analysis.overall.busy}</span>
                <span class="break-footer-item break-footer-total">👥 Всего: ${analysis.overall.total}</span>
            </div>
        `;

        panel.innerHTML = html;

        document.getElementById('settings-button')?.addEventListener('click', openSettingsModal);
    }

    // ========== МОДАЛЬНОЕ ОКНО НАСТРОЕК ==========
    function openSettingsModal() {
        if (settingsModal) {
            settingsModal.style.display = 'flex';
            return;
        }

        const overlay = document.createElement('div');
        overlay.className = 'break-modal-overlay';

        overlay.innerHTML = `
            <div class="break-modal">
                <div class="break-modal-header">
                    <h3 class="break-modal-title">⚙️ Настройки анализа</h3>
                    <span id="modal-close" class="break-modal-close">&times;</span>
                </div>
                <div class="break-modal-body">
                    <label>
                        <span class="break-modal-label">Порог "Свободен" (сек):</span>
                        <span class="break-modal-description">Время, после которого оператор считается готовым к перерыву</span>
                        <input type="number" id="setting-freeReadyThreshold" value="${CONFIG.freeReadyThreshold}" class="break-modal-input">
                    </label>
                    <label>
                        <span class="break-modal-label">Группы для анализа (через запятую):</span>
                        <span class="break-modal-description">Названия групп, которые будут анализироваться</span>
                        <input type="text" id="setting-targetGroups" value="${CONFIG.targetGroups.join(', ')}" class="break-modal-input">
                    </label>

                    <fieldset class="break-modal-fieldset">
                        <legend class="break-modal-legend">📌 Очередь = 0 (или игнорируется)</legend>
                        <label class="break-modal-field">
                            <span class="break-modal-label">Резерв операторов:</span>
                            <span class="break-modal-description">Сколько свободных операторов оставлять на случай роста очереди. Остальных можно отпустить в перерыв</span>
                            <input type="number" id="setting-reserveForQueue" value="${CONFIG.reserveForQueue}" class="break-modal-input">
                        </label>
                        <label class="break-modal-field">
                            <span class="break-modal-label">Игнорировать очередь до:</span>
                            <span class="break-modal-description">Если есть свободные операторы, очередь до этого числа игнорируется (считается как 0)</span>
                            <input type="number" id="setting-ignoreQueueIfFree" value="${CONFIG.ignoreQueueIfFree}" class="break-modal-input">
                        </label>
                    </fieldset>

                    <fieldset class="break-modal-fieldset">
                        <legend class="break-modal-legend">📌 Очередь > 0 (максимум в перерыве)</legend>
                        <label class="break-modal-field">
                            <span class="break-modal-label">При очереди 0-5:</span>
                            <span class="break-modal-description">Максимальное количество операторов в перерыве</span>
                            <input type="number" id="setting-maxBreakQueue1to5" value="${CONFIG.maxBreakQueue1to5}" class="break-modal-input">
                        </label>
                        <label class="break-modal-field">
                            <span class="break-modal-label">При очереди 6-10:</span>
                            <span class="break-modal-description">Максимальное количество операторов в перерыве</span>
                            <input type="number" id="setting-maxBreakQueue6to10" value="${CONFIG.maxBreakQueue6to10}" class="break-modal-input">
                        </label>
                        <label class="break-modal-field">
                            <span class="break-modal-label">При очереди 10+:</span>
                            <span class="break-modal-description">Максимальное количество операторов в перерыве</span>
                            <input type="number" id="setting-maxBreakQueue10plus" value="${CONFIG.maxBreakQueue10plus}" class="break-modal-input">
                        </label>
                    </fieldset>

                    <div class="break-modal-actions">
                        <button id="settings-save" class="break-modal-btn break-modal-btn-save">Сохранить</button>
                        <button id="settings-reset" class="break-modal-btn break-modal-btn-reset">Сброс</button>
                        <button id="settings-cancel" class="break-modal-btn break-modal-btn-cancel">Отмена</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        settingsModal = overlay;

        document.getElementById('modal-close').addEventListener('click', closeModal);
        document.getElementById('settings-cancel').addEventListener('click', closeModal);
        document.getElementById('settings-save').addEventListener('click', () => {
            const newConfig = {
                freeReadyThreshold: parseInt(document.getElementById('setting-freeReadyThreshold').value, 10) || DEFAULT_CONFIG.freeReadyThreshold,
                targetGroups: document.getElementById('setting-targetGroups').value.split(',').map(s => s.trim()).filter(Boolean),
                reserveForQueue: parseInt(document.getElementById('setting-reserveForQueue').value, 10) || DEFAULT_CONFIG.reserveForQueue,
                ignoreQueueIfFree: parseInt(document.getElementById('setting-ignoreQueueIfFree').value, 10) || DEFAULT_CONFIG.ignoreQueueIfFree,
                maxBreakQueue1to5: parseInt(document.getElementById('setting-maxBreakQueue1to5').value, 10) || DEFAULT_CONFIG.maxBreakQueue1to5,
                maxBreakQueue6to10: parseInt(document.getElementById('setting-maxBreakQueue6to10').value, 10) || DEFAULT_CONFIG.maxBreakQueue6to10,
                maxBreakQueue10plus: parseInt(document.getElementById('setting-maxBreakQueue10plus').value, 10) || DEFAULT_CONFIG.maxBreakQueue10plus
            };
            CONFIG = newConfig;
            saveConfig();
            closeModal();
            update();
        });
        document.getElementById('settings-reset').addEventListener('click', () => {
            document.getElementById('setting-freeReadyThreshold').value = DEFAULT_CONFIG.freeReadyThreshold;
            document.getElementById('setting-targetGroups').value = DEFAULT_CONFIG.targetGroups.join(', ');
            document.getElementById('setting-reserveForQueue').value = DEFAULT_CONFIG.reserveForQueue;
            document.getElementById('setting-ignoreQueueIfFree').value = DEFAULT_CONFIG.ignoreQueueIfFree;
            document.getElementById('setting-maxBreakQueue1to5').value = DEFAULT_CONFIG.maxBreakQueue1to5;
            document.getElementById('setting-maxBreakQueue6to10').value = DEFAULT_CONFIG.maxBreakQueue6to10;
            document.getElementById('setting-maxBreakQueue10plus').value = DEFAULT_CONFIG.maxBreakQueue10plus;
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });

        function closeModal() {
            overlay.remove();
            settingsModal = null;
        }
    }

    // ========== ОБНОВЛЕНИЕ ==========
    function update() {
        if (!isTargetPage()) {
            if (panelWrapper) {
                panelWrapper.style.display = 'none';
            }
            return;
        }

        const created = createPanel();
        if (!created) {
            return;
        }

        const groups = parseData();
        if (!groups) {
            if (panel) {
                panel.innerHTML = `<div class="break-error">❌ Таблицы не найдены</div>`;
            }
            return;
        }
        const analysis = analyze(groups);
        if (analysis) {
            renderPanel(analysis);
        } else {
            console.warn('⚠️ [BreakAdvisor] analyze вернул null');
        }
    }

    // ========== УЛУЧШЕННЫЙ MUTATION OBSERVER ==========
    let textObserver = null;
    let lastTextFound = false;
    let initializationCheckDone = false;

    function setupTextObserver() {
        // Отключаем старый observer
        if (textObserver) {
            textObserver.disconnect();
            textObserver = null;
        }

        // Создаем новый observer для отслеживания изменений в body
        textObserver = new MutationObserver((mutations) => {
            // Проверяем наличие текста
            const isTarget = isTargetPage();

            // Если статус изменился или это первая проверка
            if (isTarget !== lastTextFound || !initializationCheckDone) {
                const oldState = lastTextFound;
                lastTextFound = isTarget;
                initializationCheckDone = true;

                if (isTarget) {                    
                    setTimeout(() => update(), 500);
                } else {
                    if (oldState !== isTarget) {
                        console.log('❌ [BreakAdvisor] Текст пропал, скрываем панель');
                    }
                    // Если текст пропал - скрываем панель
                    if (panelWrapper) {
                        panelWrapper.style.display = 'none';
                    }
                }
            }
        });

        // Наблюдаем за всем body на изменения
        textObserver.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true,
            characterDataOldValue: true,
            attributes: false
        });

        // Инициализируем начальное состояние с задержкой
        setTimeout(() => {
            const isTarget = isTargetPage();
            lastTextFound = isTarget;
            initializationCheckDone = true;

            if (isTarget) {               
                setTimeout(() => update(), 500);
            } else {                
                // Периодически проверяем в течение первых 10 секунд
                let attempts = 0;
                const maxAttempts = 10;
                const checkInterval = setInterval(() => {
                    attempts++;
                    if (isTargetPage()) {
                        clearInterval(checkInterval);
                        lastTextFound = true;                        
                        setTimeout(() => update(), 500);
                    } else if (attempts >= maxAttempts) {
                        clearInterval(checkInterval);                        
                    }
                }, 1000);
            }
        }, 2000);
    }

    // ========== ЗАПУСК ==========

    addStyles();

    // Настраиваем новый TextObserver
    setupTextObserver();

    // Дополнительная проверка через 5 секунд
    setTimeout(() => {
        if (isTargetPage() && !lastTextFound) {
            lastTextFound = true;            
            update();
        }
    }, 5000);

    // Периодическое обновление данных
    setInterval(() => {
        if (isTargetPage()) {
            update();
        }
    }, UPDATE_INTERVAL);

})();