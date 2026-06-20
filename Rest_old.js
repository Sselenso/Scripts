// ==UserScript==
// @name         Анализ перерывов с настройкой
// @namespace    http://tampermonkey.net/
// @version      3.5
// @description  Анализ перерывов
// @match        https://ai.sknt.ru/monitoring_cc
// @grant        none
// @updateURL    https://raw.githubusercontent.com/Sselenso/Scripts/main/Rest.js
// @downloadURL  https://raw.githubusercontent.com/Sselenso/Scripts/main/Rest.js
// ==/UserScript==

(function() {
    'use strict';

    console.log('🚀 [BreakAdvisor] Скрипт запущен, версия 3.5 (исправлены названия групп)');

    // ========== ЦВЕТОВАЯ СХЕМА ==========
    const COLORS = {
        primary: '#2196F3',
        primaryDark: '#1976D2',
        success: '#4CAF50',
        successDark: '#388E3C',
        warning: '#FF9800',
        warningDark: '#F57C00',
        error: '#F44336',
        errorDark: '#D32F2F',
        bg: '#FFFFFF',
        bgSoft: '#F5F5F5',
        text: '#212121',
        textSoft: '#616161',
        border: '#E0E0E0',
        shadow: '0 5px 15px rgba(0, 0, 0, 0.1)'
    };

    // ========== НАСТРОЙКИ ==========
    const DEFAULT_CONFIG = {
        freeReadyThreshold: 60,
        targetGroups: ['AO', 'ТехПо'],
        queue0LimitIfFree: 3,
        queue0LimitNoFree: 2,
        queue0UseFreeIfMoreThan: 3,
        queue1to7Limit: 2,
        queue8plusLimit: 1
    };

    let CONFIG = loadConfig();
    console.log('⚙️ [BreakAdvisor] Конфигурация:', CONFIG);

    function loadConfig() {
        try {
            const saved = localStorage.getItem('breakAdvisorConfig');
            if (saved) {
                const parsed = JSON.parse(saved);
                console.log('✅ [BreakAdvisor] Конфиг загружен из localStorage');
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
            console.log('💾 [BreakAdvisor] Конфиг сохранён');
        } catch (e) {
            console.error('❌ [BreakAdvisor] Ошибка сохранения:', e);
        }
    }

    // ========== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ==========
    const UPDATE_INTERVAL = 15000;
    let settingsModal = null;

    // ========== СОЗДАНИЕ ПАНЕЛИ ==========
    const panel = document.createElement('div');
    panel.id = 'break-advisor-panel';
    Object.assign(panel.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: COLORS.bg,
        color: COLORS.text,
        padding: '16px 20px',
        borderRadius: '8px',
        zIndex: '9999',
        minWidth: '620px',
        maxWidth: '800px',
        fontSize: '14px',
        boxShadow: COLORS.shadow,
        fontFamily: 'Segoe UI, Roboto, Arial, sans-serif',
        border: `1px solid ${COLORS.border}`,
        transition: 'all 0.2s ease'
    });
    panel.innerHTML = '<div style="text-align:center;color:#666;padding:20px">⏳ Загрузка данных...</div>';
    document.body.appendChild(panel);
    console.log('🎨 [BreakAdvisor] Панель создана');

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

    function createElement(tag, attrs = {}, styles = {}, children = []) {
        const el = document.createElement(tag);
        Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
        Object.entries(styles).forEach(([k, v]) => el.style[k] = v);
        children.forEach(child => {
            if (typeof child === 'string') {
                el.appendChild(document.createTextNode(child));
            } else {
                el.appendChild(child);
            }
        });
        return el;
    }

    // ========== ПАРСИНГ ДАННЫХ ==========
    function parseData() {
        console.log('🔍 [BreakAdvisor] === НАЧАЛО ПАРСИНГА ===');
        const tables = document.querySelectorAll('table._table_g86u9_1');
        console.log(`📊 [BreakAdvisor] Найдено таблиц: ${tables.length}`);

        if (tables.length < 2) {
            console.warn('⚠️ [BreakAdvisor] Ожидалось 2 таблицы, найдено:', tables.length);
            return null;
        }

        const summaryTable = tables[0];
        const detailTable = tables[1];

        // === ПАРСИНГ СВОДНОЙ ТАБЛИЦЫ (очереди) ===
        const groupMetrics = {};
        console.log('📋 [BreakAdvisor] === ПАРСИНГ СВОДНОЙ ТАБЛИЦЫ ===');
        summaryTable.querySelectorAll('tr').forEach((row, rowIndex) => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 2) {
                const name = cells[0].innerText.trim();
                const queueRaw = cells[1].innerText.trim();
                const queue = parseInt(queueRaw, 10);

                console.log(`📊 [BreakAdvisor] Сводная[${rowIndex}]: "${name}" | очередь: "${queueRaw}" → ${queue} (${isNaN(queue) ? 'NaN!' : 'OK'})`);

                if (name && !isNaN(queue)) {
                    groupMetrics[name] = { queue };
                } else {
                    console.warn(`⚠️ [BreakAdvisor] Пропущено: name="${name}", queue=${queue}`);
                }
            }
        });
        console.log('✅ [BreakAdvisor] Сводная таблица:', groupMetrics);

        // === ПАРСИНГ ДЕТАЛЬНОЙ ТАБЛИЦЫ (операторы) ===
        const groups = {};
        let currentGroup = null;

        console.log('📋 [BreakAdvisor] === ПАРСИНГ ДЕТАЛЬНОЙ ТАБЛИЦЫ ===');
        detailTable.querySelectorAll('tr').forEach(row => {
            const header = row.querySelector('td[colspan="5"]');
            if (header) {
                // 🔧 ИСПРАВЛЕНИЕ: Очищаем название от " Статистика" и ссылок
                const rawText = header.innerText.trim().replace(/<!---->/g, '');
                currentGroup = rawText
                    .replace(/\s*Статистика\s*/g, '')  // Удаляем "Статистика"
                    .trim();

                console.log(`🏷️ [BreakAdvisor] Заголовок: "${rawText}" → "${currentGroup}"`);

                // Игнорируем статистические группы
                if (currentGroup.includes('Статистика')) {
                    console.log(`⏭️ [BreakAdvisor] Пропускаем статистику: ${currentGroup}`);
                    currentGroup = null;
                    return;
                }

                if (!groups[currentGroup]) {
                    groups[currentGroup] = { total: 0, freeReady: 0, freeShort: 0, busy: 0, offline: 0, ringing: 0 };
                    console.log(`🆕 [BreakAdvisor] Новая группа: ${currentGroup}`);
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

        // === ПРИВАИВАЕМ ОЧЕРЕДИ К ГРУППАМ ===
        for (const group in groups) {
            groups[group].queue = groupMetrics[group]?.queue ?? 0;
            console.log(`📦 [BreakAdvisor] Итог: ${group} → queue=${groups[group].queue}, freeReady=${groups[group].freeReady}, offline=${groups[group].offline}`);
        }

        console.log('✅ [BreakAdvisor] === ПАРСИНГ ЗАВЕРШЁН ===');
        return groups;
    }

    // ========== АНАЛИЗ ==========
    function analyze(groups) {
        console.log('🧠 [BreakAdvisor] === НАЧАЛО АНАЛИЗА ===');
        if (!groups) {
            console.warn('⚠️ [BreakAdvisor] groups === null');
            return null;
        }

        const result = {
            timestamp: Date.now(),
            groups: {},
            overall: { freeReady: 0, freeShort: 0, offline: 0, busy: 0, total: 0 }
        };

        for (const [name, data] of Object.entries(groups)) {
            if (!CONFIG.targetGroups.includes(name)) {
                console.log(`⏭️ [BreakAdvisor] Пропускаем ${name} (не в targetGroups: ${CONFIG.targetGroups.join(', ')})`);
                continue;
            }

            const queue = data.queue;
            console.log(`🔎 [BreakAdvisor] Анализируем: ${name}, очередь: ${queue}`);

            const {
                queue0LimitIfFree = DEFAULT_CONFIG.queue0LimitIfFree,
                queue0LimitNoFree = DEFAULT_CONFIG.queue0LimitNoFree,
                queue0UseFreeIfMoreThan = DEFAULT_CONFIG.queue0UseFreeIfMoreThan,
                queue1to7Limit = DEFAULT_CONFIG.queue1to7Limit,
                queue8plusLimit = DEFAULT_CONFIG.queue8plusLimit
            } = CONFIG;

            let maxAllowed;
            if (queue === 0) {
                if (data.freeReady > queue0UseFreeIfMoreThan) {
                    maxAllowed = data.freeReady;
                    console.log(`📐 ${name}: freeReady(${data.freeReady}) > ${queue0UseFreeIfMoreThan} → max = freeReady`);
                } else if (data.freeReady > 0) {
                    maxAllowed = queue0LimitIfFree;
                    console.log(`📐 ${name}: freeReady > 0 → max = ${queue0LimitIfFree}`);
                } else {
                    maxAllowed = queue0LimitNoFree;
                    console.log(`📐 ${name}: freeReady = 0 → max = ${queue0LimitNoFree}`);
                }
            } else if (queue >= 1 && queue <= 7) {
                maxAllowed = queue1to7Limit;
                console.log(`📐 ${name}: queue 1-7 → max = ${queue1to7Limit}`);
            } else {
                maxAllowed = queue8plusLimit;
                console.log(`📐 ${name}: queue 8+ → max = ${queue8plusLimit}`);
            }

            if (maxAllowed === undefined) {
                console.warn('❗ [BreakAdvisor] maxAllowed undefined для', name);
                maxAllowed = 0;
            }

            const offline = data.offline;
            let action, actionStyle;
            if (offline === maxAllowed) {
                action = '✅ Оптимально';
                actionStyle = { bg: COLORS.success, color: '#fff', border: COLORS.successDark };
            } else if (offline < maxAllowed) {
                const need = maxAllowed - offline;
                action = `🔺 Отпустить ${need} (до ${maxAllowed})`;
                actionStyle = { bg: COLORS.warning, color: '#fff', border: COLORS.warningDark };
            } else {
                const excess = offline - maxAllowed;
                action = `🔻 Вернуть ${excess}`;
                actionStyle = { bg: COLORS.error, color: '#fff', border: COLORS.errorDark };
            }

            result.groups[name] = {
                queue, freeReady: data.freeReady, freeShort: data.freeShort,
                busy: data.busy, offline, total: data.total, maxAllowed, action, actionStyle
            };

            result.overall.freeReady += data.freeReady;
            result.overall.freeShort += data.freeShort;
            result.overall.offline += data.offline;
            result.overall.busy += data.busy;
            result.overall.total += data.total;
        }

        console.log('✅ [BreakAdvisor] === АНАЛИЗ ЗАВЕРШЁН ===');
        return result;
    }

    // ========== ОТРИСОВКА ПАНЕЛИ ==========
    function renderPanel(analysis) {
        console.log('🎨 [BreakAdvisor] Отрисовка панели...');
        if (!analysis) {
            panel.innerHTML = `<div style="color:${COLORS.error};text-align:center;padding:20px">❌ Нет данных для анализа</div>`;
            return;
        }

        const timeStr = new Date(analysis.timestamp).toLocaleTimeString('ru-RU');

        let html = `
            <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid ${COLORS.border};padding-bottom:12px;margin-bottom:16px">
                <span style="font-size:18px;font-weight:600;color:${COLORS.primary}">📊 Перерывы</span>
                <div style="display:flex;gap:8px;align-items:center">
                    <span style="font-size:12px;color:${COLORS.textSoft};background:${COLORS.bgSoft};padding:4px 12px;border-radius:20px;border:1px solid ${COLORS.border}">обн. ${timeStr}</span>
                    <span id="settings-button" style="cursor:pointer;font-size:18px;color:${COLORS.primary};font-weight:600" title="Настройки">⚙️</span>
                </div>
            </div>
            <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:space-between">
        `;

        for (const [name, g] of Object.entries(analysis.groups)) {
            const recText = g.maxAllowed !== undefined ? g.maxAllowed : '?';
            const cardBorder = g.queue > 7 ? COLORS.error : (g.freeReady === 0 && g.queue > 0 ? COLORS.warning : COLORS.primary);
            const cardBg = g.queue > 7 ? '#FFEBEE' : (g.freeReady === 0 && g.queue > 0 ? '#FFF3E0' : COLORS.bg);

            html += `
                <div style="flex:1 0 290px;background:${cardBg};border-radius:8px;padding:14px;border:1px solid ${cardBorder};box-shadow:0 2px 6px rgba(0,0,0,0.08)">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
                        <span style="font-size:18px;font-weight:600;color:${COLORS.text}">${name}</span>
                        <span style="background:${COLORS.primary};color:#fff;padding:4px 14px;border-radius:30px;font-size:13px;font-weight:600">🎯 ${recText}</span>
                    </div>
                    <div style="height:1px;background:${COLORS.border};margin:8px 0"></div>
                    <div style="margin-bottom:12px">
                        <span style="background:${COLORS.bgSoft};padding:6px 14px;border-radius:20px;font-size:13px;border:1px solid ${COLORS.border}">
                            📋 Очередь: <strong style="color:${COLORS.primary}">${g.queue}</strong>
                        </span>
                    </div>
                    <div style="background:${COLORS.bgSoft};padding:10px 14px;border-radius:30px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;border:1px solid ${COLORS.border}">
                        <span>👥 <strong>${g.total}</strong></span>
                        <span><span style="color:${COLORS.success}">🟢</span> <strong>${g.freeReady}</strong></span>
                        <span><span style="color:${COLORS.error}">🔴</span> <strong>${g.offline}</strong></span>
                        <span><span style="color:${COLORS.warning}">🟠</span> <strong>${g.busy}</strong></span>
                    </div>
                    <div style="margin-top:12px;background:${g.actionStyle.bg};color:${g.actionStyle.color};padding:8px 12px;border-radius:30px;font-weight:600;text-align:center;border:1px solid ${g.actionStyle.border}">
                        ${g.action}
                    </div>
                </div>
            `;
        }

        html += `</div>`;

        html += `
            <div style="margin-top:18px;padding-top:12px;border-top:1px solid ${COLORS.border};display:flex;justify-content:space-around;color:${COLORS.textSoft};font-size:13px;flex-wrap:wrap;gap:6px">
                <span style="background:#E8F5E9;color:#2E7D32;padding:4px 12px;border-radius:20px;border:1px solid ${COLORS.success}">🟢 Свободен: ${analysis.overall.freeReady}</span>
                <span style="background:#FFF8E1;color:#5D4037;padding:4px 12px;border-radius:20px;border:1px solid #FFC107">🟡 Ожид: ${analysis.overall.freeShort}</span>
                <span style="background:#FFEBEE;color:#C62828;padding:4px 12px;border-radius:20px;border:1px solid ${COLORS.error}">🔴 Перер: ${analysis.overall.offline}</span>
                <span style="background:#FFF3E0;color:#E65100;padding:4px 12px;border-radius:20px;border:1px solid ${COLORS.warning}">🟠 Разг: ${analysis.overall.busy}</span>
                <span style="background:#E3F2FD;color:#1565C0;padding:4px 12px;border-radius:20px;border:1px solid ${COLORS.primary}">👥 Всего: ${analysis.overall.total}</span>
            </div>
        `;

        panel.innerHTML = html;
        console.log('✅ [BreakAdvisor] Панель отрисована');

        document.getElementById('settings-button')?.addEventListener('click', openSettingsModal);
    }

    // ========== МОДАЛЬНОЕ ОКНО НАСТРОЕК ==========
    function openSettingsModal() {
        console.log('⚙️ [BreakAdvisor] Открытие настроек');
        if (settingsModal) {
            settingsModal.style.display = 'flex';
            return;
        }

        const overlay = createElement('div', {}, {
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(33, 150, 243, 0.1)', zIndex: 10000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        });

        const modal = createElement('div', {}, {
            background: COLORS.bg, color: COLORS.text, padding: '24px',
            borderRadius: '8px', maxWidth: '520px', width: '90%',
            maxHeight: '85vh', overflowY: 'auto',
            border: `1px solid ${COLORS.border}`,
            boxShadow: '0 10px 30px rgba(33,150,243,0.15)',
            fontFamily: 'Segoe UI, Roboto, Arial, sans-serif'
        });

        modal.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;padding-bottom:15px;border-bottom:1px solid ${COLORS.border}">
                <h3 style="margin:0;color:${COLORS.primary};font-size:20px;font-weight:600">⚙️ Настройки анализа</h3>
                <span id="modal-close" style="font-size:24px;cursor:pointer;color:${COLORS.textSoft};line-height:1">&times;</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:16px">
                <label>
                    <span style="display:block;margin-bottom:6px;color:${COLORS.text};font-weight:500">Порог "Свободен" (сек):</span>
                    <input type="number" id="setting-freeReadyThreshold" value="${CONFIG.freeReadyThreshold}"
                           style="width:100%;padding:10px;background:${COLORS.bgSoft};border:1px solid ${COLORS.border};color:${COLORS.text};border-radius:4px;font-size:14px">
                </label>
                <label>
                    <span style="display:block;margin-bottom:6px;color:${COLORS.text};font-weight:500">Группы (через запятую):</span>
                    <input type="text" id="setting-targetGroups" value="${CONFIG.targetGroups.join(', ')}"
                           style="width:100%;padding:10px;background:${COLORS.bgSoft};border:1px solid ${COLORS.border};color:${COLORS.text};border-radius:4px;font-size:14px">
                </label>
                <fieldset style="border:1px solid ${COLORS.border};border-radius:6px;padding:14px">
                    <legend style="color:${COLORS.textSoft};padding:0 8px;font-size:14px">Правила для очереди 0</legend>
                    <label style="display:block;margin-bottom:10px">
                        Лимит, если есть свободные (>0):
                        <input type="number" id="setting-queue0LimitIfFree" value="${CONFIG.queue0LimitIfFree}"
                               style="width:80px;margin-left:10px;padding:6px;background:${COLORS.bgSoft};border:1px solid ${COLORS.border};color:${COLORS.text};border-radius:4px">
                    </label>
                    <label style="display:block;margin-bottom:10px">
                        Лимит, если нет свободных:
                        <input type="number" id="setting-queue0LimitNoFree" value="${CONFIG.queue0LimitNoFree}"
                               style="width:80px;margin-left:10px;padding:6px;background:${COLORS.bgSoft};border:1px solid ${COLORS.border};color:${COLORS.text};border-radius:4px">
                    </label>
                    <label style="display:block">
                        Если свободных > N, то лимит = все свободные:
                        <input type="number" id="setting-queue0UseFreeIfMoreThan" value="${CONFIG.queue0UseFreeIfMoreThan}"
                               style="width:80px;margin-left:10px;padding:6px;background:${COLORS.bgSoft};border:1px solid ${COLORS.border};color:${COLORS.text};border-radius:4px">
                    </label>
                </fieldset>
                <label>
                    <span style="display:block;margin-bottom:6px;color:${COLORS.text};font-weight:500">Лимит при очереди 1-7:</span>
                    <input type="number" id="setting-queue1to7Limit" value="${CONFIG.queue1to7Limit}"
                           style="width:100%;padding:10px;background:${COLORS.bgSoft};border:1px solid ${COLORS.border};color:${COLORS.text};border-radius:4px;font-size:14px">
                </label>
                <label>
                    <span style="display:block;margin-bottom:6px;color:${COLORS.text};font-weight:500">Лимит при очереди 8+:</span>
                    <input type="number" id="setting-queue8plusLimit" value="${CONFIG.queue8plusLimit}"
                           style="width:100%;padding:10px;background:${COLORS.bgSoft};border:1px solid ${COLORS.border};color:${COLORS.text};border-radius:4px;font-size:14px">
                </label>
                <div style="display:flex;gap:10px;margin-top:20px">
                    <button id="settings-save" style="flex:2;background:${COLORS.primary};color:#fff;border:none;padding:10px 16px;border-radius:40px;font-weight:600;cursor:pointer;box-shadow:0 2px 4px rgba(33,150,243,0.3);transition:background 0.2s">Сохранить</button>
                    <button id="settings-reset" style="flex:1;background:#9E9E9E;color:#fff;border:none;padding:10px 16px;border-radius:40px;font-weight:600;cursor:pointer;transition:background 0.2s">Сброс</button>
                    <button id="settings-cancel" style="flex:1;background:${COLORS.bgSoft};color:${COLORS.text};border:1px solid ${COLORS.border};padding:10px 16px;border-radius:40px;font-weight:600;cursor:pointer;transition:background 0.2s">Отмена</button>
                </div>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        settingsModal = overlay;

        document.getElementById('modal-close').addEventListener('click', closeModal);
        document.getElementById('settings-cancel').addEventListener('click', closeModal);
        document.getElementById('settings-save').addEventListener('click', () => {
            console.log('💾 [BreakAdvisor] Сохранение настроек');
            const newConfig = {
                freeReadyThreshold: parseInt(document.getElementById('setting-freeReadyThreshold').value, 10) || DEFAULT_CONFIG.freeReadyThreshold,
                targetGroups: document.getElementById('setting-targetGroups').value.split(',').map(s => s.trim()).filter(Boolean),
                queue0LimitIfFree: parseInt(document.getElementById('setting-queue0LimitIfFree').value, 10) || DEFAULT_CONFIG.queue0LimitIfFree,
                queue0LimitNoFree: parseInt(document.getElementById('setting-queue0LimitNoFree').value, 10) || DEFAULT_CONFIG.queue0LimitNoFree,
                queue0UseFreeIfMoreThan: parseInt(document.getElementById('setting-queue0UseFreeIfMoreThan').value, 10) || DEFAULT_CONFIG.queue0UseFreeIfMoreThan,
                queue1to7Limit: parseInt(document.getElementById('setting-queue1to7Limit').value, 10) || DEFAULT_CONFIG.queue1to7Limit,
                queue8plusLimit: parseInt(document.getElementById('setting-queue8plusLimit').value, 10) || DEFAULT_CONFIG.queue8plusLimit
            };
            CONFIG = newConfig;
            saveConfig();
            closeModal();
            update();
        });
        document.getElementById('settings-reset').addEventListener('click', () => {
            console.log('🔄 [BreakAdvisor] Сброс настроек');
            document.getElementById('setting-freeReadyThreshold').value = DEFAULT_CONFIG.freeReadyThreshold;
            document.getElementById('setting-targetGroups').value = DEFAULT_CONFIG.targetGroups.join(', ');
            document.getElementById('setting-queue0LimitIfFree').value = DEFAULT_CONFIG.queue0LimitIfFree;
            document.getElementById('setting-queue0LimitNoFree').value = DEFAULT_CONFIG.queue0LimitNoFree;
            document.getElementById('setting-queue0UseFreeIfMoreThan').value = DEFAULT_CONFIG.queue0UseFreeIfMoreThan;
            document.getElementById('setting-queue1to7Limit').value = DEFAULT_CONFIG.queue1to7Limit;
            document.getElementById('setting-queue8plusLimit').value = DEFAULT_CONFIG.queue8plusLimit;
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });

        function closeModal() {
            console.log('🔙 [BreakAdvisor] Закрытие модального окна');
            overlay.remove();
            settingsModal = null;
        }
    }

    // ========== ОБНОВЛЕНИЕ ==========
    function update() {
        console.log('🔄 [BreakAdvisor] === ЗАПУСК update() ===');
        const groups = parseData();
        if (!groups) {
            panel.innerHTML = `<div style="color:${COLORS.error};text-align:center;padding:20px">❌ Таблицы не найдены</div>`;
            console.error('❌ [BreakAdvisor] parseData вернул null');
            return;
        }
        const analysis = analyze(groups);
        if (analysis) {
            renderPanel(analysis);
            console.log('✅ [BreakAdvisor] === update() ЗАВЕРШЁН ===');
        } else {
            console.warn('⚠️ [BreakAdvisor] analyze вернул null');
        }
    }

    // ========== ЗАПУСК ==========
    console.log('⏱️ [BreakAdvisor] Планируем запуск: 5 сек задержка, затем каждые 15 сек');
    setTimeout(() => {
        console.log('▶️ [BreakAdvisor] Первый запуск');
        update();
    }, 5000);

    setInterval(() => {
        console.log('🔁 [BreakAdvisor] Плановый запуск');
        update();
    }, UPDATE_INTERVAL);

    // MutationObserver
    if (typeof MutationObserver !== 'undefined') {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(m => {
                if (m.addedNodes.length) {
                    console.log(`🔍 [BreakAdvisor] DOM изменён: +${m.addedNodes.length} узлов`);
                }
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });
        console.log('👁️ [BreakAdvisor] MutationObserver подключён');
    }
})();