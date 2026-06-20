// ==UserScript==
// @name         Мониторинг алерт и окрашивание чатов Pro
// @namespace    http://tampermonkey.net/
// @version      6.1
// @description  Мониторинг алертов и чатов с гибридными уведомлениями и журналом событий + единый стиль
// @author       Sselenso
// @match        https://ai.sknt.ru/monitoring_cc
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_listValues
// @grant        GM_deleteValue
// @grant        GM_log
// @updateURL    https://raw.githubusercontent.com/Sselenso/Scripts/main/Monitoring_alert_pro.js
// @downloadURL  https://raw.githubusercontent.com/Sselenso/Scripts/main/Monitoring_alert_pro.js
// ==/UserScript==

(function () {
    "use strict";

    // ========================================================================
    // 1. ЕДИНЫЕ СТИЛИ
    // ========================================================================
    const STYLES = `
        /* ===== ОБЩИЕ ПЕРЕМЕННЫЕ ===== */
        :root {
            --alert-bg-primary: #FFFFFF;
            --alert-bg-secondary: #F5F5F5;
            --alert-text-primary: #212121;
            --alert-text-secondary: #616161;
            --alert-text-invert: #FFFFFF;
            --alert-border: #E0E0E0;
            --alert-accent: #58676e;
            --alert-success: #4CAF50;
            --alert-warning: #FF9800;
            --alert-danger: #F44336;
            --alert-info: #2196F3;
        }

        /* ===== TOAST УВЕДОМЛЕНИЯ ===== */
        #toast-container {
            position: fixed;
            top: 60px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 400px;
        }

        .toast-notification {
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            font-size: 14px;
            line-height: 1.4;
            position: relative;
            animation: slideIn 0.3s ease-out;
        }

        .toast-notification .toast-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
            font-weight: 600;
        }

        .toast-notification .toast-title {
            font-size: 16px;
        }

        .toast-notification .toast-close {
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0.8;
        }

        .toast-notification .toast-close:hover { opacity: 1; }

        .toast-notification .toast-exclude-btn {
            margin-top: 10px;
            padding: 6px 12px;
            background: rgba(255, 255, 255, 0.2);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
            display: block;
            width: 100%;
        }

        .toast-notification .toast-exclude-btn:hover {
            background: rgba(255, 255, 255, 0.3);
        }

        /* ===== ЖУРНАЛ СОБЫТИЙ ===== */
        #logWindow {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 800px;
            height: 600px;
            background: var(--alert-bg-primary);
            border-radius: 8px;
            padding: 20px;
            z-index: 9999;
            box-shadow: 0 5px 30px rgba(0, 0, 0, 0.3);
            border: 1px solid var(--alert-border);
            display: none;
            flex-direction: column;
        }

        #logWindow .log-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid var(--alert-border);
        }

        #logWindow .log-header h2 {
            margin: 0;
            color: var(--alert-text-primary);
            font-size: 20px;
            font-weight: 600;
        }

        #logWindow .log-header .log-close {
            font-size: 28px;
            cursor: pointer;
            color: var(--alert-text-secondary);
            line-height: 1;
        }

        #logWindow .log-header .log-close:hover { color: var(--alert-text-primary); }

        #logWindow .log-controls {
            display: flex;
            gap: 10px;
            margin-bottom: 15px;
        }

        #logWindow .log-controls button {
            padding: 8px 12px;
            background: var(--alert-bg-secondary);
            color: var(--alert-text-primary);
            border: 1px solid var(--alert-border);
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            flex: 1;
        }

        #logWindow .log-controls button:hover {
            background: #E0E0E0;
        }

        #logContainer {
            flex: 1;
            overflow-y: auto;
            border: 1px solid var(--alert-border);
            border-radius: 4px;
            padding: 10px;
            background: #fafafa;
        }

        #logStats {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid var(--alert-border);
            color: var(--alert-text-secondary);
            font-size: 12px;
            display: flex;
            justify-content: space-between;
        }

        .log-event {
            display: flex;
            align-items: flex-start;
            padding: 10px 12px;
            margin-bottom: 8px;
            border-radius: 4px;
            font-size: 13px;
            transition: background 0.2s;
            cursor: pointer;
        }

        .log-event-unread { background: #f0f7ff; }
        .log-event-read { background: #fff; }

        .log-event .log-icon { margin-right: 10px; font-size: 16px; min-width: 20px; }
        .log-event .log-content { flex: 1; min-width: 0; }
        .log-event .log-header-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
        }
        .log-event .log-time {
            color: var(--alert-text-secondary);
            font-size: 12px;
            font-weight: 500;
        }
        .log-event .log-badge {
            padding: 2px 6px;
            border-radius: 10px;
            font-size: 11px;
            font-weight: 500;
            color: white;
        }
        .log-event .log-message {
            color: var(--alert-text-primary);
            line-height: 1.4;
            word-break: break-word;
        }

        .log-empty {
            text-align: center;
            color: var(--alert-text-secondary);
            font-style: italic;
            padding: 40px;
        }

        /* ===== КНОПКИ ===== */
        #settingsButton {
            position: fixed;
            top: 10px;
            right: 460px;
            z-index: 9998;
            padding: 8px 16px;
            background: var(--alert-bg-secondary);
            color: var(--alert-text-primary);
            border: 1px solid var(--alert-border);
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
        }

        #settingsButton:hover {
            background: #E0E0E0;
        }

        /* ===== ОКНО НАСТРОЕК ===== */
        #settingsWindow {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 500px;
            background: var(--alert-bg-primary);
            border-radius: 8px;
            padding: 20px;
            z-index: 9999;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
            border: 1px solid var(--alert-border);
            max-height: 80vh;
            overflow-y: auto;
            display: none;
        }

        #settingsWindow .settings-close {
            position: absolute;
            top: 15px;
            right: 15px;
            font-size: 24px;
            cursor: pointer;
            color: var(--alert-text-secondary);
        }

        #settingsWindow .settings-close:hover {
            color: var(--alert-text-primary);
        }

        #settingsWindow h2 {
            margin: 0 0 20px 0;
            color: var(--alert-text-primary);
            font-size: 20px;
            font-weight: 600;
        }

        #settingsWindow h3 {
            margin: 0 0 15px 0;
            color: var(--alert-text-primary);
            font-size: 16px;
            font-weight: 600;
        }

        .settings-tabs {
            display: flex;
            border-bottom: 1px solid var(--alert-border);
            margin-bottom: 20px;
        }

        .settings-tabs button {
            padding: 10px 20px;
            background: transparent;
            color: var(--alert-text-primary);
            border: none;
            border-bottom: 2px solid transparent;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            flex: 1;
        }

        .settings-tabs button.active {
            background: var(--alert-info);
            color: white;
            border-bottom-color: var(--alert-info);
        }

        .settings-tabs button:not(.active):hover {
            background: var(--alert-bg-secondary);
        }

        .settings-row {
            margin-bottom: 15px;
        }

        .settings-row label {
            display: block;
            margin-bottom: 5px;
            color: var(--alert-text-primary);
            font-size: 14px;
            font-weight: 500;
        }

        .settings-row .settings-desc {
            margin-top: 5px;
            color: var(--alert-text-secondary);
            font-size: 12px;
            font-style: italic;
        }

        .settings-row input[type="text"],
        .settings-row input[type="number"] {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid var(--alert-border);
            border-radius: 4px;
            font-size: 14px;
            box-sizing: border-box;
            background: var(--alert-bg-primary);
            color: var(--alert-text-primary);
        }

        .settings-row input[type="text"]:focus,
        .settings-row input[type="number"]:focus {
            border-color: var(--alert-info);
            outline: none;
        }

        .settings-row input[type="checkbox"] {
            margin-right: 10px;
            width: 18px;
            height: 18px;
            cursor: pointer;
        }

        .settings-row .checkbox-label {
            display: flex;
            align-items: center;
            cursor: pointer;
        }

        .settings-row .checkbox-label span {
            font-size: 14px;
            color: var(--alert-text-primary);
        }

        .settings-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid var(--alert-border);
        }

        .settings-actions button {
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            border: 1px solid transparent;
        }

        .settings-actions .btn-reset {
            background: var(--alert-bg-secondary);
            color: var(--alert-text-primary);
            border-color: var(--alert-border);
        }

        .settings-actions .btn-reset:hover {
            background: #E0E0E0;
        }

        .settings-actions .btn-apply {
            background: var(--alert-info);
            color: white;
        }

        .settings-actions .btn-apply:hover {
            background: #1976D2;
        }

        /* ===== ИСКЛЮЧЕНИЯ ===== */
        .exclusions-input {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        }

        .exclusions-input input {
            flex: 1;
            padding: 8px 12px;
            border: 1px solid var(--alert-border);
            border-radius: 4px;
            font-size: 14px;
            background: var(--alert-bg-primary);
            color: var(--alert-text-primary);
        }

        .exclusions-input button {
            padding: 8px 16px;
            background: var(--alert-success);
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
        }

        .exclusions-input button:hover {
            background: #388E3C;
        }

        #exclusionsList {
            max-height: 200px;
            overflow-y: auto;
            border: 1px solid var(--alert-border);
            border-radius: 4px;
            padding: 10px;
        }

        .exclusion-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            border-bottom: 1px solid var(--alert-border);
            font-size: 14px;
        }

        .exclusion-item:last-child { border-bottom: none; }

        .exclusion-item .exclusion-remove {
            padding: 4px 8px;
            background: var(--alert-danger);
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
        }

        .exclusion-item .exclusion-remove:hover {
            background: #D32F2F;
        }

        .exclusion-empty {
            color: var(--alert-text-secondary);
            font-style: italic;
            text-align: center;
            padding: 20px;
        }

        /* ===== АНИМАЦИИ ===== */
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }

        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;

    // ========================================================================
    // 2. УТИЛИТЫ
    // ========================================================================
    const Utils = {
        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        throttle(func, limit) {
            let inThrottle;
            return function() {
                const args = arguments;
                const context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },

        formatTime(date) {
            return date.toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        },

        formatDate(date) {
            return date.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        },

        parseTimeToSeconds(str) {
            str = str.trim();
            if (str === '-' || str === '–') return 0;
            let total = 0;
            const parts = str.split(' ');
            for (let i = 0; i < parts.length; i += 2) {
                const val = parseInt(parts[i], 10);
                if (isNaN(val)) continue;
                const unit = parts[i + 1] || '';
                if (unit.includes('мин') || unit.includes('минут')) total += val * 60;
                else if (unit.includes('сек') || unit.includes('секунд')) total += val;
                else if (unit.includes('час') || unit.includes('часа') || unit.includes('часов')) total += val * 3600;
            }
            return total;
        },

        extractOperatorName(fullText) {
            return fullText
                .replace(/^[^\wа-яА-ЯёЁ]*/, '')
                .replace(/\s*\[\d+\]\s*/, '')
                .replace(/\s*\(\d+\)\s*/g, '')
                .replace(/\s*-\s*(?:разговаривает|недоступен|выключен|говорит).*/i, '')
                .replace(/[^\wа-яА-ЯёЁ\s]/g, '')
                .replace(/\s+/g, ' ')
                .trim();
        },

        createElement(tag, attributes = {}, styles = {}, children = []) {
            const element = document.createElement(tag);

            Object.entries(attributes).forEach(([key, value]) => {
                element.setAttribute(key, value);
            });

            Object.entries(styles).forEach(([key, value]) => {
                element.style[key] = value;
            });

            children.forEach(child => {
                if (typeof child === 'string') {
                    element.appendChild(document.createTextNode(child));
                } else {
                    element.appendChild(child);
                }
            });

            return element;
        },

        isTargetPage() {
            const bodyText = document.body?.innerText || '';
            const htmlText = document.documentElement?.innerText || '';

            const searchPatterns = [
                'Мониторинг КЦ Статистика входящих звонков Вся статистика',
                'Мониторинг КЦ Статистика входящих звонков',
                'Статистика входящих звонков Вся статистика',
                'Мониторинг КЦ'
            ];

            for (const pattern of searchPatterns) {
                const normalizedBody = bodyText.replace(/\s+/g, ' ').trim();
                const normalizedHtml = htmlText.replace(/\s+/g, ' ').trim();
                const normalizedPattern = pattern.replace(/\s+/g, ' ').trim();

                if (normalizedBody.includes(normalizedPattern) || normalizedHtml.includes(normalizedPattern)) {
                    return true;
                }
            }

            return false;
        }
    };

    // ========================================================================
    // 3. МЕНЕДЖЕР СОСТОЯНИЯ (УЛУЧШЕННЫЙ)
    // ========================================================================
    class StateManager {
        constructor() {
            this.notificationHistory = new Map();
            this.originalTitle = document.title;
            this.useGM = typeof GM_getValue !== 'undefined';
            
            // Загружаем настройки при создании
            this.settings = this.loadSettings();
            
            // Сохраняем настройки при закрытии страницы
            window.addEventListener('beforeunload', () => {
                this.saveAllSettings();
            });
            
            // Сохраняем настройки при видимости
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.saveAllSettings();
                }
            });
        }

        loadSettings() {
            const defaults = {
                conversationTime: 900,
                unavailableEnabled: true,
                unavailableTime: 30,
                disabledEnabled: true,
                disabledTime: 1200,
                soundEnabled: false,
                useBrowserNotifications: false,
                showToastInBrowser: true,
                logEnabled: true,
                logSize: 100,
                excludedOperators: []
            };

            const settings = { ...defaults };

            for (const [key, defaultValue] of Object.entries(defaults)) {
                const storageKey = `monitoring_${key}`;
                let stored;

                try {
                    // Сначала пробуем получить из localStorage
                    stored = localStorage.getItem(storageKey);
                    
                    // Если нет в localStorage, пробуем из GM
                    if (stored === null && this.useGM) {
                        const gmValue = GM_getValue(storageKey);
                        if (gmValue !== null && gmValue !== undefined) {
                            stored = JSON.stringify(gmValue);
                        }
                    }
                } catch (e) {
                    console.warn(`Ошибка при загрузке настройки ${key}:`, e);
                    stored = null;
                }

                if (stored !== null && stored !== undefined) {
                    try {
                        const parsed = JSON.parse(stored);
                        settings[key] = parsed;
                    } catch (e) {
                        // Если не парсится, используем как есть
                        if (typeof defaultValue === 'boolean') {
                            settings[key] = stored === 'true' || stored === true;
                        } else if (typeof defaultValue === 'number') {
                            settings[key] = Number(stored) || defaultValue;
                        } else {
                            settings[key] = stored;
                        }
                    }
                }
            }

            return settings;
        }

        saveSetting(key, value) {
            const storageKey = `monitoring_${key}`;
            
            try {
                // Всегда сохраняем в localStorage
                localStorage.setItem(storageKey, JSON.stringify(value));
                
                // Если есть GM, сохраняем и туда
                if (this.useGM) {
                    GM_setValue(storageKey, JSON.stringify(value));
                }
            } catch (e) {
                console.warn(`Ошибка при сохранении настройки ${key}:`, e);
            }

            this.settings[key] = value;
        }

        saveAllSettings() {
            try {
                for (const [key, value] of Object.entries(this.settings)) {
                    const storageKey = `monitoring_${key}`;
                    localStorage.setItem(storageKey, JSON.stringify(value));
                    
                    if (this.useGM) {
                        GM_setValue(storageKey, JSON.stringify(value));
                    }
                }
            } catch (e) {
                console.warn('Ошибка при массовом сохранении настроек:', e);
            }
        }

        getSetting(key) {
            return this.settings[key];
        }

        updateNotificationHistory(key, timestamp) {
            this.notificationHistory.set(key, timestamp);
        }

        getLastNotificationTime(key) {
            return this.notificationHistory.get(key);
        }
        
        // Метод для сброса настроек
        resetSettings() {
            const defaults = {
                conversationTime: 900,
                unavailableEnabled: true,
                unavailableTime: 30,
                disabledEnabled: true,
                disabledTime: 1200,
                soundEnabled: false,
                useBrowserNotifications: false,
                showToastInBrowser: true,
                logEnabled: true,
                logSize: 100,
                excludedOperators: []
            };
            
            // Удаляем все настройки из localStorage
            for (const key of Object.keys(defaults)) {
                localStorage.removeItem(`monitoring_${key}`);
                if (this.useGM) {
                    try {
                        GM_deleteValue(`monitoring_${key}`);
                    } catch (e) {
                        // Игнорируем ошибки
                    }
                }
            }
            
            this.settings = { ...defaults };
            this.saveAllSettings();
            
            return this.settings;
        }
    }

    // ========================================================================
    // 4. СИСТЕМА УВЕДОМЛЕНИЙ
    // ========================================================================
    class NotificationSystem {
        static stateManager = null;
        static toastContainer = null;

        static init(stateManager) {
            this.stateManager = stateManager;
            this.createToastSystem();
            this.requestNotificationPermission();
        }

        static createToastSystem() {
            if (this.toastContainer) return;

            this.toastContainer = document.createElement('div');
            this.toastContainer.id = 'toast-container';
            document.body.appendChild(this.toastContainer);
        }

        static showToast(message, type = "warning", duration = 5000) {
            this.createToastSystem();

            const colors = {
                warning: { bg: '#ff9800', border: '#f57c00', title: '⚠️ Внимание' },
                error: { bg: '#f44336', border: '#d32f2f', title: '❌ Ошибка' },
                success: { bg: '#4CAF50', border: '#388e3c', title: '✅ Успешно' },
                info: { bg: '#2196F3', border: '#1976d2', title: 'ℹ️ Информация' }
            };

            const scheme = colors[type] || colors.info;

            const toast = document.createElement('div');
            toast.className = 'toast-notification';
            toast.style.background = scheme.bg;
            toast.style.borderLeft = `4px solid ${scheme.border}`;

            toast.innerHTML = `
                <div class="toast-header">
                    <span class="toast-title">${scheme.title}</span>
                    <button class="toast-close">×</button>
                </div>
                <div class="toast-content">${message}</div>
            `;

            toast.querySelector('.toast-close').addEventListener('click', () => {
                this.removeToast(toast);
            });

            // Добавляем кнопку исключения для алертов
            if (message.includes('🗣️') || message.includes('❌') || message.includes('🔴')) {
                const cleanName = Utils.extractOperatorName(message);
                const excluded = this.stateManager.getSetting('excludedOperators');

                if (!excluded.includes(cleanName)) {
                    const excludeBtn = document.createElement('button');
                    excludeBtn.className = 'toast-exclude-btn';
                    excludeBtn.textContent = '🚫 Исключить';
                    excludeBtn.addEventListener('click', () => {
                        excluded.push(cleanName);
                        this.stateManager.saveSetting('excludedOperators', excluded);
                        this.showToast(`Оператор "${cleanName}" добавлен в исключения`, "success", 3000);
                        this.removeToast(toast);
                    });
                    toast.querySelector('.toast-content').appendChild(excludeBtn);
                }
            }

            this.toastContainer.appendChild(toast);
            this.blinkTabTitle(type);

            if (this.stateManager.getSetting('soundEnabled')) {
                this.playSound();
            }

            setTimeout(() => this.removeToast(toast), duration);
        }

        static removeToast(toast) {
            toast.style.animation = 'slideOut 0.3s ease-out forwards';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }

        static blinkTabTitle(type) {
            let blinkCount = 0;
            const maxBlinks = 6;
            let isBlinking = false;

            const titles = {
                warning: '⚠️ Внимание!',
                error: '❌ Ошибка!',
                success: '✅ Успешно!',
                info: 'ℹ️ Информация'
            };

            const blinkText = titles[type] || '⚠️ Внимание!';

            const blinkInterval = setInterval(() => {
                document.title = isBlinking ? this.stateManager.originalTitle : blinkText;
                isBlinking = !isBlinking;
                blinkCount++;

                if (blinkCount >= maxBlinks * 2) {
                    clearInterval(blinkInterval);
                    document.title = this.stateManager.originalTitle;
                }
            }, 400);
        }

        static requestNotificationPermission() {
            if ("Notification" in window && Notification.permission === "default") {
                setTimeout(() => {
                    Notification.requestPermission().then(permission => {
                        if (permission === "granted") {
                            this.showToast("Браузерные уведомления разрешены", "success", 3000);
                        }
                    });
                }, 3000);
            }
        }

        static playSound() {
            try {
                const audio = new Audio("https://www.dropbox.com/scl/fi/exu5d8q0ms2bt7dyrrarg/mixkit-alert-bells-echo-765.wav?rlkey=4o1silnbmgnu14eey8iqyabxp&st=2sc2kq5j&raw=1");
                audio.volume = 0.5;
                audio.play().catch(() => {});
            } catch (error) {}
        }

        static showHybridNotification(message, type = "warning") {
            const now = Date.now();
            const notificationKey = `${type}_${message.substring(0, 50)}`;

            const lastTime = this.stateManager.getLastNotificationTime(notificationKey);
            if (lastTime && (now - lastTime < 60000)) {
                return;
            }

            this.stateManager.updateNotificationHistory(notificationKey, now);

            if (this.stateManager.getSetting('showToastInBrowser')) {
                this.showToast(message, type, 8000);
            }

            if (this.stateManager.getSetting('soundEnabled')) {
                this.playSound();
            }

            if (!document.hasFocus()) {
                this.blinkTabTitle(type);
            }
        }
    }

    // ========================================================================
    // 5. СИСТЕМА ЛОГИРОВАНИЯ (УЛУЧШЕННАЯ)
    // ========================================================================
    class LogSystem {
        constructor(stateManager) {
            this.stateManager = stateManager;
            this.useGM = typeof GM_getValue !== 'undefined';
            this.init();
        }

        init() {
            // Инициализируем лог, если его нет
            if (!localStorage.getItem("eventLog")) {
                localStorage.setItem("eventLog", JSON.stringify([]));
            }
            
            if (this.useGM && !GM_getValue("eventLog")) {
                GM_setValue("eventLog", JSON.stringify([]));
            }
        }

        getLog() {
            try {
                // Сначала пробуем из localStorage
                let logData = localStorage.getItem("eventLog");
                
                // Если нет в localStorage, пробуем из GM
                if (!logData && this.useGM) {
                    const gmData = GM_getValue("eventLog");
                    if (gmData) {
                        logData = gmData;
                        // Сохраняем в localStorage для синхронизации
                        localStorage.setItem("eventLog", logData);
                    }
                }
                
                return logData ? JSON.parse(logData) : [];
            } catch (error) {
                console.error("Ошибка при чтении лога:", error);
                return [];
            }
        }

        saveLog(log) {
            try {
                const limitedLog = log.slice(0, this.stateManager.getSetting('logSize') || 100);
                const logString = JSON.stringify(limitedLog);

                // Сохраняем везде
                localStorage.setItem("eventLog", logString);
                if (this.useGM) {
                    GM_setValue("eventLog", logString);
                }
            } catch (error) {
                console.error("Ошибка при сохранении лога:", error);
            }
        }

        addEntry(type, message, details = {}) {
            if (!this.stateManager.getSetting('logEnabled')) return;

            const entry = {
                id: Date.now() + Math.random().toString(36).substr(2, 9),
                timestamp: new Date().toISOString(),
                timeDisplay: Utils.formatTime(new Date()),
                dateDisplay: Utils.formatDate(new Date()),
                type: type,
                message: message,
                details: { ...details, windowFocused: document.hasFocus() },
                acknowledged: false
            };

            const log = this.getLog();
            log.unshift(entry);
            this.saveLog(log);

            if (window.logWindow && window.logWindow.updateUI) {
                window.logWindow.updateUI();
            }
        }

        clear() {
            if (confirm("Очистить весь журнал событий?")) {
                this.saveLog([]);
                if (window.logWindow && window.logWindow.updateUI) {
                    window.logWindow.updateUI();
                }
                NotificationSystem.showToast("Журнал событий очищен", "success", 3000);
            }
        }

        export() {
            try {
                const log = this.getLog();
                if (log.length === 0) {
                    NotificationSystem.showToast("Журнал пуст", "info", 3000);
                    return;
                }

                const dataStr = JSON.stringify(log, null, 2);
                const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
                const exportFileDefaultName = `monitoring_log_${new Date().toISOString().slice(0, 10)}.json`;

                const linkElement = document.createElement('a');
                linkElement.setAttribute('href', dataUri);
                linkElement.setAttribute('download', exportFileDefaultName);
                linkElement.click();

                NotificationSystem.showToast("Журнал экспортирован", "success", 3000);
            } catch (error) {
                NotificationSystem.showToast("Ошибка при экспорте журнала", "error", 3000);
            }
        }

        markAllAsRead() {
            try {
                const log = this.getLog();
                const updatedLog = log.map(event => ({ ...event, acknowledged: true }));
                this.saveLog(updatedLog);

                if (window.logWindow && window.logWindow.updateUI) {
                    window.logWindow.updateUI();
                }

                NotificationSystem.showToast("Все события отмечены как прочитанные", "success", 3000);
            } catch (error) {
                console.error("Ошибка при обновлении лога:", error);
            }
        }
    }

    // ========================================================================
    // 6. ОКНО ЖУРНАЛА
    // ========================================================================
    class LogWindow {
        constructor(stateManager, logSystem) {
            this.stateManager = stateManager;
            this.logSystem = logSystem;
            this.windowElement = null;
            this.init();
        }

        init() {
            if (document.getElementById("logWindow")) return;
            this.createWindow();
        }

        createWindow() {
            this.windowElement = document.createElement('div');
            this.windowElement.id = 'logWindow';

            this.windowElement.innerHTML = `
                <div class="log-header">
                    <h2>📝 Журнал алертов</h2>
                    <span class="log-close">×</span>
                </div>
                <div class="log-controls">
                    <button id="markAllRead">📌 Отметить все прочитанными</button>
                    <button id="exportLog">💾 Экспорт</button>
                    <button id="clearLog">🗑️ Очистить</button>
                </div>
                <div id="logContainer"></div>
                <div id="logStats"></div>
            `;

            this.windowElement.querySelector('.log-close').addEventListener('click', () => {
                this.windowElement.style.display = 'none';
            });

            this.windowElement.querySelector('#markAllRead').addEventListener('click', () => {
                this.logSystem.markAllAsRead();
            });

            this.windowElement.querySelector('#exportLog').addEventListener('click', () => {
                this.logSystem.export();
            });

            this.windowElement.querySelector('#clearLog').addEventListener('click', () => {
                this.logSystem.clear();
            });

            document.body.appendChild(this.windowElement);
        }

        show() {
            if (this.windowElement) {
                this.windowElement.style.display = 'flex';
                this.updateUI();
            }
        }

        updateUI() {
            const logContainer = document.getElementById('logContainer');
            const stats = document.getElementById('logStats');

            if (!logContainer || !stats) return;

            try {
                const allLogs = this.logSystem.getLog();
                const filteredLogs = allLogs.filter(event =>
                    event.type === 'alert' &&
                    (event.message.includes('🗣️') || event.message.includes('❌') || event.message.includes('🔴'))
                );

                if (filteredLogs.length === 0) {
                    stats.innerHTML = 'Алертов: 0';
                    logContainer.innerHTML = '<div class="log-empty">Журнал алертов пуст</div>';
                    return;
                }

                const unreadCount = filteredLogs.filter(e => !e.acknowledged).length;
                stats.innerHTML = `
                    <div>Алертов: ${filteredLogs.length}</div>
                    <div>Непрочитанных: ${unreadCount}</div>
                    <div>Последнее: ${filteredLogs[0]?.timeDisplay || 'нет'}</div>
                `;

                this.renderLogContent(filteredLogs, logContainer);
            } catch (error) {
                logContainer.innerHTML = `<div style="color: #f44336; padding: 20px; text-align: center;">Ошибка загрузки журнала: ${error.message}</div>`;
            }
        }

        renderLogContent(logs, container) {
            const groupedByDate = {};
            logs.forEach(event => {
                const date = event.dateDisplay || event.timestamp.split('T')[0];
                if (!groupedByDate[date]) {
                    groupedByDate[date] = [];
                }
                groupedByDate[date].push(event);
            });

            const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a));
            container.innerHTML = '';

            sortedDates.forEach(date => {
                const dateSection = document.createElement('div');
                dateSection.style.marginBottom = '20px';

                const dateHeader = document.createElement('div');
                dateHeader.style.cssText = `
                    font-weight: bold;
                    color: var(--alert-text-primary);
                    background: var(--alert-bg-secondary);
                    padding: 8px 12px;
                    border-radius: 4px;
                    margin-bottom: 10px;
                    font-size: 14px;
                    position: sticky;
                    top: 0;
                    z-index: 1;
                `;
                dateHeader.textContent = date;
                dateSection.appendChild(dateHeader);

                groupedByDate[date].forEach(event => {
                    const eventElement = this.createLogEventElement(event);
                    dateSection.appendChild(eventElement);
                });

                container.appendChild(dateSection);
            });
        }

        createLogEventElement(event) {
            const colors = {
                talking: '#ff9800',
                unavailable: '#f44336',
                disabled: '#9c27b0'
            };

            let icon = '📄';
            let color = '#607d8b';
            let type = 'Алерт';

            if (event.message.includes('🗣️')) { icon = '🗣️'; color = colors.talking; type = 'Разговаривает'; }
            else if (event.message.includes('❌')) { icon = '❌'; color = colors.unavailable; type = 'Недоступен'; }
            else if (event.message.includes('🔴')) { icon = '🔴'; color = colors.disabled; type = 'Выключен'; }

            const element = document.createElement('div');
            element.className = `log-event ${event.acknowledged ? 'log-event-read' : 'log-event-unread'}`;
            element.style.borderLeft = `3px solid ${color}`;

            element.innerHTML = `
                <span class="log-icon">${icon}</span>
                <div class="log-content">
                    <div class="log-header-row">
                        <span class="log-time">${event.timeDisplay || Utils.formatTime(new Date(event.timestamp))}</span>
                        <span class="log-badge" style="background: ${color}">${type}</span>
                    </div>
                    <div class="log-message">${event.message.replace(/\s+/g, ' ').trim()}</div>
                </div>
            `;

            element.addEventListener('click', () => {
                this.toggleEventRead(event.id);
            });

            return element;
        }

        toggleEventRead(eventId) {
            try {
                const log = this.logSystem.getLog();
                const eventIndex = log.findIndex(e => e.id === eventId);
                if (eventIndex !== -1) {
                    log[eventIndex].acknowledged = !log[eventIndex].acknowledged;
                    this.logSystem.saveLog(log);
                    this.updateUI();
                }
            } catch (error) {
                console.error('Ошибка при обновлении события:', error);
            }
        }
    }

    // ========================================================================
    // 7. СИСТЕМА НАСТРОЕК
    // ========================================================================
    class SettingsSystem {
        constructor(stateManager, logSystem) {
            this.stateManager = stateManager;
            this.logSystem = logSystem;
            this.windowElement = null;
            this.activeTab = 'tab-main';
            this.init();
        }

        init() {
            this.createSettingsButton();
            this.createSettingsWindow();
        }

        createSettingsButton() {
            if (document.getElementById('settingsButton')) return;

            const button = document.createElement('button');
            button.id = 'settingsButton';
            button.textContent = '⚙️ Настройки';
            button.addEventListener('click', () => this.show());
            document.body.appendChild(button);
        }

        createSettingsWindow() {
            if (document.getElementById('settingsWindow')) return;

            this.windowElement = document.createElement('div');
            this.windowElement.id = 'settingsWindow';

            this.windowElement.innerHTML = `
                <span class="settings-close">×</span>
                <h2>⚙️ Настройки мониторинга</h2>
                <div class="settings-tabs">
                    <button id="tab-main" class="active">Основные</button>
                    <button id="tab-notifications">Уведомления</button>
                    <button id="tab-log">Журнал</button>
                    <button id="tab-exclusions">Исключения</button>
                </div>
                <div id="tabContents"></div>
                <div class="settings-actions">
                    <button class="btn-reset" id="resetSettings">Сброс</button>
                    <button class="btn-apply" id="applySettings">Применить</button>
                </div>
            `;

            this.windowElement.querySelector('.settings-close').addEventListener('click', () => {
                this.windowElement.style.display = 'none';
            });

            // Tabs
            const tabs = this.windowElement.querySelectorAll('.settings-tabs button');
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    this.switchTab(tab.id);
                });
            });

            // Buttons
            this.windowElement.querySelector('#resetSettings').addEventListener('click', () => {
                this.resetSettings();
            });

            this.windowElement.querySelector('#applySettings').addEventListener('click', () => {
                this.applySettings();
            });

            document.body.appendChild(this.windowElement);

            // Create tab contents
            this.createTabContents();
        }

        createTabContents() {
            const container = document.getElementById('tabContents');
            if (!container) return;

            // Main tab
            const mainTab = document.createElement('div');
            mainTab.id = 'tab-main-content';
            mainTab.style.display = 'block';

            const mainSettings = [
                { key: 'conversationTime', label: 'Максимальное время разговора (сек):', desc: 'По умолчанию: 900 сек (15 мин)', type: 'number' },
                { key: 'unavailableEnabled', label: 'Проверять статус "Недоступен"', type: 'checkbox' },
                { key: 'unavailableTime', label: 'Время статуса "Недоступен" (сек):', desc: 'По умолчанию: 30 сек', type: 'number' },
                { key: 'disabledEnabled', label: 'Проверять статус "Выключен"', type: 'checkbox' },
                { key: 'disabledTime', label: 'Время статуса "Выключен" (сек):', desc: 'По умолчанию: 1200 сек (20 мин)', type: 'number' }
            ];

            mainSettings.forEach(setting => {
                const row = this.createSettingRow(setting);
                mainTab.appendChild(row);
            });

            container.appendChild(mainTab);

            // Notifications tab
            const notifTab = document.createElement('div');
            notifTab.id = 'tab-notifications-content';
            notifTab.style.display = 'none';

            const notifSettings = [
                { key: 'soundEnabled', label: 'Звуковые уведомления', desc: 'Воспроизводить звук при алерте', type: 'checkbox' },
                { key: 'showToastInBrowser', label: 'Toast-уведомления в браузере', desc: 'Показывать всплывающие уведомления в правом углу', type: 'checkbox' },
                { key: 'useBrowserNotifications', label: 'Браузерные уведомления', desc: 'Показывать системные уведомления только когда браузер свернут или окно не активно', type: 'checkbox' }
            ];

            notifSettings.forEach(setting => {
                const row = this.createSettingRow(setting);
                notifTab.appendChild(row);
            });

            container.appendChild(notifTab);

            // Log tab
            const logTab = document.createElement('div');
            logTab.id = 'tab-log-content';
            logTab.style.display = 'none';

            const logSettings = [
                { key: 'logEnabled', label: 'Вести журнал алертов', desc: 'Записывать только алерты (разговаривает/выключен/недоступен) в журнал', type: 'checkbox' },
                { key: 'logSize', label: 'Максимальное количество записей:', desc: 'По умолчанию: 100 записей. Старые записи будут удаляться', type: 'number' }
            ];

            logSettings.forEach(setting => {
                const row = this.createSettingRow(setting);
                logTab.appendChild(row);
            });

            const openLogBtn = document.createElement('button');
            openLogBtn.style.cssText = `
                margin-top: 20px;
                padding: 10px 16px;
                background: var(--alert-success);
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                width: 100%;
            `;
            openLogBtn.textContent = '📝 Открыть журнал алертов';
            openLogBtn.addEventListener('click', () => {
                this.windowElement.style.display = 'none';
                if (window.logWindow) {
                    window.logWindow.show();
                }
            });
            logTab.appendChild(openLogBtn);

            container.appendChild(logTab);

            // Exclusions tab
            const exclTab = document.createElement('div');
            exclTab.id = 'tab-exclusions-content';
            exclTab.style.display = 'none';

            const exclDesc = document.createElement('p');
            exclDesc.style.cssText = 'margin: 0 0 15px 0; color: var(--alert-text-secondary); font-size: 14px;';
            exclDesc.textContent = 'Операторы в этом списке не будут проверяться системой мониторинга.';
            exclTab.appendChild(exclDesc);

            const inputContainer = document.createElement('div');
            inputContainer.className = 'exclusions-input';

            const input = document.createElement('input');
            input.type = 'text';
            input.id = 'excludeInput';
            input.placeholder = 'Введите имя оператора (без номера)';

            const addBtn = document.createElement('button');
            addBtn.textContent = 'Добавить';
            addBtn.addEventListener('click', () => {
                const name = input.value.trim();
                if (!name) return;

                const excluded = this.stateManager.getSetting('excludedOperators');
                if (!excluded.includes(name)) {
                    excluded.push(name);
                    this.stateManager.saveSetting('excludedOperators', excluded);
                    this.updateExclusionsList();
                    input.value = '';
                    NotificationSystem.showToast(`"${name}" добавлен в исключения`, 'success', 3000);
                }
            });

            inputContainer.appendChild(input);
            inputContainer.appendChild(addBtn);
            exclTab.appendChild(inputContainer);

            const listContainer = document.createElement('div');
            listContainer.id = 'exclusionsList';
            exclTab.appendChild(listContainer);

            container.appendChild(exclTab);

            // Load current values
            this.loadCurrentSettings();
            this.updateExclusionsList();
        }

        createSettingRow(setting) {
            const row = document.createElement('div');
            row.className = 'settings-row';

            if (setting.type === 'checkbox') {
                const label = document.createElement('label');
                label.className = 'checkbox-label';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `setting-${setting.key}`;
                checkbox.checked = this.stateManager.getSetting(setting.key);

                label.appendChild(checkbox);
                label.appendChild(document.createTextNode(' ' + setting.label));
                row.appendChild(label);
            } else {
                const label = document.createElement('label');
                label.textContent = setting.label;
                row.appendChild(label);

                const input = document.createElement('input');
                input.type = 'number';
                input.id = `setting-${setting.key}`;
                input.value = this.stateManager.getSetting(setting.key);

                row.appendChild(input);
            }

            if (setting.desc) {
                const desc = document.createElement('div');
                desc.className = 'settings-desc';
                desc.textContent = setting.desc;
                row.appendChild(desc);
            }

            return row;
        }

        switchTab(tabId) {
            this.activeTab = tabId;

            const tabs = this.windowElement.querySelectorAll('.settings-tabs button');
            tabs.forEach(tab => {
                tab.classList.toggle('active', tab.id === tabId);
            });

            const contents = this.windowElement.querySelectorAll('#tabContents > div');
            contents.forEach(content => {
                content.style.display = content.id === `${tabId}-content` ? 'block' : 'none';
            });
        }

        show() {
            if (this.windowElement) {
                this.windowElement.style.display = 'block';
                this.loadCurrentSettings();
                this.updateExclusionsList();
            }
        }

        loadCurrentSettings() {
            const settings = [
                'conversationTime', 'unavailableEnabled', 'unavailableTime',
                'disabledEnabled', 'disabledTime', 'soundEnabled',
                'showToastInBrowser', 'useBrowserNotifications', 'logEnabled', 'logSize'
            ];

            settings.forEach(key => {
                const element = document.getElementById(`setting-${key}`);
                if (element) {
                    const value = this.stateManager.getSetting(key);
                    if (element.type === 'checkbox') {
                        element.checked = value;
                    } else {
                        element.value = value;
                    }
                }
            });
        }

        updateExclusionsList() {
            const list = document.getElementById('exclusionsList');
            if (!list) return;

            const excluded = this.stateManager.getSetting('excludedOperators');

            if (excluded.length === 0) {
                list.innerHTML = '<div class="exclusion-empty">Список исключений пуст</div>';
                return;
            }

            list.innerHTML = '';
            excluded.forEach((operator, index) => {
                const item = document.createElement('div');
                item.className = 'exclusion-item';

                const name = document.createElement('span');
                name.textContent = operator;

                const removeBtn = document.createElement('button');
                removeBtn.className = 'exclusion-remove';
                removeBtn.textContent = 'Удалить';
                removeBtn.addEventListener('click', () => {
                    excluded.splice(index, 1);
                    this.stateManager.saveSetting('excludedOperators', excluded);
                    this.updateExclusionsList();
                    NotificationSystem.showToast(`"${operator}" удален из исключений`, 'info', 3000);
                });

                item.appendChild(name);
                item.appendChild(removeBtn);
                list.appendChild(item);
            });
        }

        applySettings() {
            try {
                const settings = [
                    'conversationTime', 'unavailableEnabled', 'unavailableTime',
                    'disabledEnabled', 'disabledTime', 'soundEnabled',
                    'showToastInBrowser', 'useBrowserNotifications', 'logEnabled', 'logSize'
                ];

                settings.forEach(key => {
                    const element = document.getElementById(`setting-${key}`);
                    if (element) {
                        let value;
                        if (element.type === 'checkbox') {
                            value = element.checked;
                        } else {
                            value = parseInt(element.value) || 0;
                            if (key === 'logSize' && value < 1) value = 100;
                        }
                        this.stateManager.saveSetting(key, value);
                    }
                });

                NotificationSystem.showToast('Настройки успешно сохранены', 'success', 3000);
                this.windowElement.style.display = 'none';
            } catch (error) {
                NotificationSystem.showToast('Ошибка при сохранении настроек', 'error', 3000);
            }
        }

        resetSettings() {
            if (confirm('Сбросить все настройки к значениям по умолчанию?')) {
                this.stateManager.resetSettings();
                this.loadCurrentSettings();
                this.updateExclusionsList();
                NotificationSystem.showToast('Настройки сброшены', 'success', 3000);
            }
        }
    }

    // ========================================================================
    // 8. СИСТЕМА МОНИТОРИНГА
    // ========================================================================
    class MonitoringSystem {
        constructor(stateManager, logSystem) {
            this.stateManager = stateManager;
            this.logSystem = logSystem;
            this.specialTexts = ['AO', 'ТехПо', 'Кантри 1 линия', 'Кантри ТехПо'];
            this.statuses = {
                TALKING: 'Разговаривает',
                UNAVAILABLE: 'Недоступен',
                DISABLED: 'Выключен'
            };
            this.icons = {
                'Разговаривает': '🗣️',
                'Недоступен': '❌',
                'Выключен': '🔴'
            };
            this.cooldowns = {
                talking: 300000,
                unavailable: 60000,
                disabled: 180000
            };
            this.textReplacements = {
                'Чатов закрыто': 'Закрыто',
                'Чатов в работе': 'В работе',
                'Время статуса': 'Время',
                'Статус оператора': 'Статус',
                'Имя оператора': 'Оператор'
            };
        }

        init() {
            this.startMonitoring();
            this.applyPageEnhancements();
        }

        startMonitoring() {
            this.checkAlerts();
            setInterval(() => this.checkAlerts(), 15000);
        }

        checkAlerts() {
            try {
                let rows = document.querySelectorAll('._tableRow_26gbz_1, .tcbf0bc.r4d22b2, tr[class*="tableRow"], table tr');

                if (rows.length === 0) {
                    const tables = document.querySelectorAll('table');
                    if (tables.length > 0) {
                        rows = tables[0].querySelectorAll('tr');
                    }
                }

                if (rows.length === 0) return;

                const now = Date.now();
                rows.forEach((row) => {
                    this.processRow(row, now);
                });
            } catch (error) {
                console.error('Ошибка при проверке алертов:', error);
            }
        }

        processRow(row, now) {
            try {
                let cells = row.querySelectorAll('._tableCell_1a192_1, .tf6e7cf.c0d3473, td[class*="tableCell"], td');

                if (cells.length < 4) return;

                const nameCell = cells[0];
                const statusCell = cells[2];
                const timeCell = cells[3];

                const name = nameCell?.textContent?.trim() || '';
                const status = statusCell?.textContent?.trim() || '';
                const timeText = timeCell?.textContent?.trim() || '';

                if (!name || this.specialTexts.includes(name) || name === 'ИТОГО') return;

                const cleanName = Utils.extractOperatorName(name);
                const excluded = this.stateManager.getSetting('excludedOperators');

                if (excluded.includes(cleanName)) return;

                const totalSeconds = Utils.parseTimeToSeconds(timeText);
                const statusType = this.getStatusType(status);
                const icon = this.icons[statusType] || '';

                if (statusType) {
                    this.checkAlertConditions(name, cleanName, statusType, timeText, totalSeconds, icon, now);
                }
            } catch (error) {
                console.error('Ошибка при обработке строки:', error);
            }
        }

        getStatusType(status) {
            if (status.includes(this.statuses.TALKING)) return this.statuses.TALKING;
            if (status.includes(this.statuses.UNAVAILABLE)) return this.statuses.UNAVAILABLE;
            if (status.includes(this.statuses.DISABLED)) return this.statuses.DISABLED;
            return null;
        }

        checkAlertConditions(fullName, cleanName, statusType, timeText, totalSeconds, icon, now) {
            const excluded = this.stateManager.getSetting('excludedOperators');
            if (excluded.includes(cleanName)) return;

            let condition = false;
            let type = 'warning';
            let cooldownKey = '';

            switch (statusType) {
                case this.statuses.TALKING:
                    if (totalSeconds > this.stateManager.getSetting('conversationTime')) {
                        condition = true;
                        type = 'warning';
                        cooldownKey = 'talking';
                    }
                    break;
                case this.statuses.UNAVAILABLE:
                    if (this.stateManager.getSetting('unavailableEnabled') &&
                        totalSeconds > this.stateManager.getSetting('unavailableTime')) {
                        condition = true;
                        type = 'error';
                        cooldownKey = 'unavailable';
                    }
                    break;
                case this.statuses.DISABLED:
                    if (this.stateManager.getSetting('disabledEnabled') &&
                        totalSeconds > this.stateManager.getSetting('disabledTime')) {
                        condition = true;
                        type = 'warning';
                        cooldownKey = 'disabled';
                    }
                    break;
            }

            if (condition) {
                const lastAlert = this.stateManager.getLastNotificationTime(fullName);
                if (!lastAlert || now - lastAlert > this.cooldowns[cooldownKey]) {
                    const message = `${icon} ${fullName} - ${statusType.toLowerCase()} ${timeText}`;
                    NotificationSystem.showHybridNotification(message, type);
                    this.stateManager.updateNotificationHistory(fullName, now);

                    this.logSystem.addEntry('alert', message, {
                        type: type,
                        source: 'monitoring',
                        timestamp: now,
                        windowFocused: document.hasFocus()
                    });
                }
            }
        }

        applyPageEnhancements() {
            setTimeout(() => {
                this.colorSpecialCells();
                this.updatePageTexts();
            }, 2000);

            setInterval(() => {
                this.colorSpecialCells();
                this.updatePageTexts();
            }, 30000);
        }

        colorSpecialCells() {
            try {
                document.querySelectorAll('td, th').forEach(cell => {
                    const text = cell.textContent.trim();
                    if (this.specialTexts.includes(text)) {
                        cell.style.cssText = `
                            background: #58676e !important;
                            color: white !important;
                            font-weight: bold !important;
                            border-right: none !important;
                        `;
                    }
                });
            } catch (error) {
                console.error('Ошибка при окрашивании ячеек:', error);
            }
        }

        updatePageTexts() {
            try {
                document.querySelectorAll('span, div, td, th, label').forEach(el => {
                    const originalText = el.textContent.trim();
                    if (this.textReplacements[originalText]) {
                        el.textContent = this.textReplacements[originalText];
                    }
                });
            } catch (error) {
                console.error('Ошибка при обновлении текстов:', error);
            }
        }
    }

    // ========================================================================
    // 9. ГЛАВНОЕ ПРИЛОЖЕНИЕ
    // ========================================================================
    class App {
        constructor() {
            this.stateManager = new StateManager();
            this.logSystem = new LogSystem(this.stateManager);
            this.logWindow = new LogWindow(this.stateManager, this.logSystem);
            this.settingsSystem = new SettingsSystem(this.stateManager, this.logSystem);
            this.monitoringSystem = new MonitoringSystem(this.stateManager, this.logSystem);

            // Глобальные ссылки
            window.logSystem = this.logSystem;
            window.logWindow = this.logWindow;
            window.settingsSystem = this.settingsSystem;
        }

        init() {
            console.log('🚀 Мониторинг алертов запущен');

            // Добавляем стили
            this.addStyles();

            // Инициализация уведомлений
            NotificationSystem.init(this.stateManager);

            // Запуск мониторинга
            this.monitoringSystem.init();

            // Логирование настроек
            console.log('📋 Текущие настройки:', {
                'Макс разговор': `${this.stateManager.getSetting('conversationTime')} сек`,
                'Недоступен': `${this.stateManager.getSetting('unavailableEnabled') ? 'вкл' : 'выкл'} (${this.stateManager.getSetting('unavailableTime')} сек)`,
                'Выключен': `${this.stateManager.getSetting('disabledEnabled') ? 'вкл' : 'выкл'} (${this.stateManager.getSetting('disabledTime')} сек)`,
                'Звук': this.stateManager.getSetting('soundEnabled') ? 'вкл' : 'выкл',
                'Toast': this.stateManager.getSetting('showToastInBrowser') ? 'вкл' : 'выкл',
                'Браузерные уведомления': `${this.stateManager.getSetting('useBrowserNotifications') ? 'вкл' : 'выкл'} (разрешение: ${Notification.permission})`,
                'Журнал': `${this.stateManager.getSetting('logEnabled') ? 'вкл' : 'выкл'} (размер: ${this.stateManager.getSetting('logSize')})`,
                'Исключения': this.stateManager.getSetting('excludedOperators')
            });
        }

        addStyles() {
            if (document.getElementById('alert-monitoring-styles')) return;

            const styleEl = document.createElement('style');
            styleEl.id = 'alert-monitoring-styles';
            styleEl.textContent = STYLES;
            document.head.appendChild(styleEl);
        }
    }

    // ========================================================================
    // 10. ЗАПУСК
    // ========================================================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            const app = new App();
            app.init();
        });
    } else {
        const app = new App();
        app.init();
    }

})();