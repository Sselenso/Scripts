// ==UserScript==
// @name         Мониторинг КЦ PRO
// @namespace    http://tampermonkey.net/
// @version      6.0
// @description  Анализ перерывов + Мониторинг алертов с единым стилем
// @match        https://ai.sknt.ru/monitoring_cc
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_listValues
// @grant        GM_deleteValue
// @grant        GM_log
// @updateURL    https://raw.githubusercontent.com/Sselenso/Scripts/main/Monitoring_KC_PRO.js
// @downloadURL  https://raw.githubusercontent.com/Sselenso/Scripts/main/Monitoring_KC_PRO.js
// ==/UserScript==

(function() {
    'use strict';

    // ========================================================================
    // 1. ЕДИНЫЕ СТИЛИ
    // ========================================================================
    const STYLES = `
        /* ===== ОБЩИЕ СТИЛИ ===== */
        :root {
            --color-bg-primary: #FFFFFF;
            --color-bg-secondary: #F5F5F5;
            --color-text-primary: #212121;
            --color-text-secondary: #616161;
            --color-text-invert: #FFFFFF;
            --color-border: #E0E0E0;
            --color-accent: #58676e;
            --color-success: #4CAF50;
            --color-warning: #FF9800;
            --color-danger: #F44336;
            --color-info: #2196F3;
        }

        /* ===== ПАНЕЛЬ АНАЛИЗА ПЕРЕРЫВОВ ===== */
        .break-panel-wrapper {
            margin-top: 20px;
            grid-column: 1 / -1;
            width: 100%;
        }

        .break-panel {
            background: var(--color-bg-primary);
            color: var(--color-text-primary);
            border: 1px solid var(--color-border);
            font-size: 14px;
            width: 100%;
            border-radius: 4px;
            overflow: hidden;
        }

        .break-panel-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background-color: var(--color-accent) !important;
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
            color: var(--color-text-secondary);
            background: var(--color-bg-secondary);
            padding: 4px 12px;
            border-radius: 4px;
            border: 1px solid var(--color-border);
        }

        .break-settings-btn {
            cursor: pointer;
            font-size: 16px;
            color: var(--color-text-secondary);
            padding: 4px 8px;
            border-radius: 4px;
            transition: background 0.2s;
        }

        .break-settings-btn:hover {
            background: var(--color-bg-secondary);
        }

        .break-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        }

        .break-card {
            padding: 14px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }

        .break-card-queue-0 { background: #FFFFFF; }
        .break-card-queue-5 { background: #FFF8E1; }
        .break-card-queue-10 { background: #FFEBEE; }

        .break-card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 10px;
        }

        .break-card-name {
            font-size: 16px;
            font-weight: 600;
            color: var(--color-text-primary);
        }

        .break-card-badge {
            background: var(--color-info);
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
            background: var(--color-bg-secondary);
            border-radius: 4px;
        }

        .break-stat-item {
            text-align: center;
            color: var(--color-text-secondary);
        }

        .break-stat-value {
            font-weight: 600;
            color: var(--color-text-primary);
        }

        .break-stat-value-green { color: var(--color-success); }
        .break-stat-value-red { color: var(--color-danger); }

        .break-action {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6px 10px;
            border-radius: 4px;
            font-weight: 500;
        }

        .break-action-optimal { background: #bbf7d0; }
        .break-action-warning { background: var(--color-warning); color: #fff; border: 1px solid #F57C00; }
        .break-action-danger { background: var(--color-danger); color: #fff; border: 1px solid #D32F2F; }

        .break-action-text { flex: 1; }
        .break-action-sub { font-size: 12px; opacity: 0.8; }

        .break-footer {
            padding: 6px 14px;
            border-top: 1px solid var(--color-border);
            display: flex;
            justify-content: space-between;
            color: var(--color-text-secondary);
            font-size: 13px;
            flex-wrap: wrap;
            gap: 6px;
        }

        .break-footer-item {
            padding: 4px 12px;
            border-radius: 4px;
            border: 1px solid transparent;
        }

        .break-footer-free { background: #E8F5E9; color: #2E7D32; border-color: var(--color-success); }
        .break-footer-short { background: #FFF8E1; color: #5D4037; border-color: #FFC107; }
        .break-footer-offline { background: #FFEBEE; color: #C62828; border-color: var(--color-danger); }
        .break-footer-busy { background: #FFF3E0; color: #E65100; border-color: var(--color-warning); }
        .break-footer-total { background: #E3F2FD; color: #1565C0; border-color: var(--color-info); }

        .break-loading {
            text-align: center;
            color: var(--color-text-secondary);
            padding: 20px;
        }

        .break-error {
            color: var(--color-danger);
            text-align: center;
            padding: 20px;
        }

        /* ===== ТОСТ УВЕДОМЛЕНИЯ ===== */
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

        /* ===== МОДАЛЬНОЕ ОКНО ===== */
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
            background: var(--color-bg-primary);
            color: var(--color-text-primary);
            padding: 0;
            border-radius: 4px;
            max-width: 560px;
            width: 90%;
            max-height: 85vh;
            overflow-y: auto;
            border: 1px solid var(--color-border);
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }

        .break-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 20px;
            background: var(--color-accent) !important;
            border-bottom: 1px solid var(--color-border);
        }

        .break-modal-title {
            margin: 0;
            color: var(--color-text-invert);
            font-size: 16px;
            font-weight: 600;
        }

        .break-modal-close {
            font-size: 22px;
            cursor: pointer;
            color: var(--color-text-invert);
            line-height: 1;
            opacity: 0.8;
            transition: opacity 0.2s;
        }

        .break-modal-close:hover { opacity: 1; }

        .break-modal-body {
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 14px;
        }

        .break-modal-label {
            display: block;
            margin-bottom: 4px;
            color: var(--color-text-primary);
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
            background: var(--color-bg-primary);
            border: 1px solid #D0D0D0;
            color: var(--color-text-primary);
            border-radius: 4px;
            font-size: 14px;
            box-sizing: border-box;
            transition: border-color 0.2s;
        }

        .break-modal-input:focus {
            border-color: var(--color-info);
            outline: none;
        }

        .break-modal-fieldset {
            border: 1px solid var(--color-border);
            border-radius: 4px;
            padding: 12px 14px;
            margin: 0;
        }

        .break-modal-legend {
            color: var(--color-text-secondary);
            padding: 0 8px;
            font-size: 13px;
            font-weight: 500;
        }

        .break-modal-field {
            display: block;
            margin-bottom: 10px;
            font-size: 13px;
            color: var(--color-text-primary);
        }

        .break-modal-field:last-child { margin-bottom: 0; }

        .break-modal-actions {
            display: flex;
            gap: 10px;
            margin-top: 8px;
            padding-top: 14px;
            border-top: 1px solid var(--color-border);
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
            background: var(--color-info);
            color: #fff;
            border-color: #1976D2;
        }

        .break-modal-btn-save:hover { background: #1976D2; }

        .break-modal-btn-reset {
            flex: 1;
            background: #9E9E9E;
            color: #fff;
            border-color: #757575;
        }

        .break-modal-btn-reset:hover { background: #757575; }

        .break-modal-btn-cancel {
            flex: 1;
            background: var(--color-bg-secondary);
            color: var(--color-text-primary);
            border-color: #D0D0D0;
        }

        .break-modal-btn-cancel:hover { background: #E0E0E0; }

        /* ===== ЖУРНАЛ СОБЫТИЙ ===== */
        #logWindow {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 800px;
            height: 600px;
            background: var(--color-bg-primary);
            border-radius: 8px;
            padding: 20px;
            z-index: 9999;
            box-shadow: 0 5px 30px rgba(0, 0, 0, 0.3);
            border: 1px solid var(--color-border);
            display: none;
            flex-direction: column;
        }

        #logWindow .log-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid var(--color-border);
        }

        #logWindow .log-header h2 {
            margin: 0;
            color: var(--color-text-primary);
            font-size: 20px;
            font-weight: 600;
        }

        #logWindow .log-header .log-close {
            font-size: 28px;
            cursor: pointer;
            color: var(--color-text-secondary);
            line-height: 1;
        }

        #logWindow .log-header .log-close:hover { color: var(--color-text-primary); }

        #logWindow .log-controls {
            display: flex;
            gap: 10px;
            margin-bottom: 15px;
        }

        #logWindow .log-controls button {
            padding: 8px 12px;
            background: var(--color-bg-secondary);
            color: var(--color-text-primary);
            border: 1px solid var(--color-border);
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
            border: 1px solid var(--color-border);
            border-radius: 4px;
            padding: 10px;
            background: #fafafa;
        }

        #logStats {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid var(--color-border);
            color: var(--color-text-secondary);
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
            color: var(--color-text-secondary);
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
            color: var(--color-text-primary);
            line-height: 1.4;
            word-break: break-word;
        }

        /* ===== КНОПКИ ===== */
        #settingsButton {
            position: fixed;
            top: 10px;
            right: 460px;
            z-index: 9998;
            padding: 8px 16px;
            background: var(--color-bg-secondary);
            color: var(--color-text-primary);
            border: 1px solid var(--color-border);
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
            background: var(--color-bg-primary);
            border-radius: 8px;
            padding: 20px;
            z-index: 9999;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
            border: 1px solid var(--color-border);
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
            color: var(--color-text-secondary);
        }

        #settingsWindow .settings-close:hover {
            color: var(--color-text-primary);
        }

        #settingsWindow h2 {
            margin: 0 0 20px 0;
            color: var(--color-text-primary);
            font-size: 20px;
            font-weight: 600;
        }

        #settingsWindow h3 {
            margin: 0 0 15px 0;
            color: var(--color-text-primary);
            font-size: 16px;
            font-weight: 600;
        }

        .settings-tabs {
            display: flex;
            border-bottom: 1px solid var(--color-border);
            margin-bottom: 20px;
        }

        .settings-tabs button {
            padding: 10px 20px;
            background: transparent;
            color: var(--color-text-primary);
            border: none;
            border-bottom: 2px solid transparent;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            flex: 1;
        }

        .settings-tabs button.active {
            background: var(--color-info);
            color: white;
            border-bottom-color: var(--color-info);
        }

        .settings-tabs button:not(.active):hover {
            background: var(--color-bg-secondary);
        }

        .settings-row {
            margin-bottom: 15px;
        }

        .settings-row label {
            display: block;
            margin-bottom: 5px;
            color: var(--color-text-primary);
            font-size: 14px;
            font-weight: 500;
        }

        .settings-row .settings-desc {
            margin-top: 5px;
            color: var(--color-text-secondary);
            font-size: 12px;
            font-style: italic;
        }

        .settings-row input[type="text"],
        .settings-row input[type="number"] {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid var(--color-border);
            border-radius: 4px;
            font-size: 14px;
            box-sizing: border-box;
            background: var(--color-bg-primary);
            color: var(--color-text-primary);
        }

        .settings-row input[type="text"]:focus,
        .settings-row input[type="number"]:focus {
            border-color: var(--color-info);
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
            color: var(--color-text-primary);
        }

        .settings-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid var(--color-border);
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
            background: var(--color-bg-secondary);
            color: var(--color-text-primary);
            border-color: var(--color-border);
        }

        .settings-actions .btn-reset:hover {
            background: #E0E0E0;
        }

        .settings-actions .btn-apply {
            background: var(--color-info);
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
            border: 1px solid var(--color-border);
            border-radius: 4px;
            font-size: 14px;
            background: var(--color-bg-primary);
            color: var(--color-text-primary);
        }

        .exclusions-input button {
            padding: 8px 16px;
            background: var(--color-success);
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
            border: 1px solid var(--color-border);
            border-radius: 4px;
            padding: 10px;
        }

        .exclusion-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            border-bottom: 1px solid var(--color-border);
            font-size: 14px;
        }

        .exclusion-item:last-child { border-bottom: none; }

        .exclusion-item .exclusion-remove {
            padding: 4px 8px;
            background: var(--color-danger);
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
            color: var(--color-text-secondary);
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
    // 3. МЕНЕДЖЕР СОСТОЯНИЯ
    // ========================================================================
    class StateManager {
        constructor() {
            this.notificationHistory = new Map();
            this.originalTitle = document.title;
            this.settings = this.loadSettings();
            this.useGM = typeof GM_getValue !== 'undefined';
        }

        loadSettings() {
            const defaults = {
                // Break settings
                freeReadyThreshold: 60,
                targetGroups: ['AO', 'ТехПо'],
                reserveForQueue: 5,
                maxBreakQueue1to5: 3,
                maxBreakQueue6to10: 2,
                maxBreakQueue10plus: 1,
                ignoreQueueIfFree: 5,
                // Alert settings
                conversationTime: 900,
                unavailableEnabled: true,
                unavailableTime: 30,
                disabledEnabled: true,
                disabledTime: 1200,
                soundEnabled: true,
                useBrowserNotifications: false,
                showToastInBrowser: true,
                logEnabled: true,
                logSize: 100,
                excludedOperators: []
            };

            const settings = { ...defaults };

            for (const [key, defaultValue] of Object.entries(defaults)) {
                const storageKey = key.charAt(0).toLowerCase() + key.slice(0);
                let stored;

                if (this.useGM) {
                    stored = GM_getValue(storageKey);
                } else {
                    stored = localStorage.getItem(storageKey);
                }

                if (stored !== null && stored !== undefined) {
                    try {
                        settings[key] = JSON.parse(stored);
                    } catch (e) {
                        settings[key] = stored;
                    }
                }
            }

            return settings;
        }

        saveSetting(key, value) {
            const storageKey = key.charAt(0).toLowerCase() + key.slice(0);

            if (this.useGM) {
                GM_setValue(storageKey, JSON.stringify(value));
            } else {
                localStorage.setItem(storageKey, JSON.stringify(value));
            }

            this.settings[key] = value;
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
    // 5. СИСТЕМА ЛОГИРОВАНИЯ
    // ========================================================================
    class LogSystem {
        constructor(stateManager) {
            this.stateManager = stateManager;
            this.useGM = typeof GM_getValue !== 'undefined';
            this.init();
        }

        init() {
            if (this.useGM && !GM_getValue("eventLog")) {
                GM_setValue("eventLog", JSON.stringify([]));
            } else if (!localStorage.getItem("eventLog")) {
                localStorage.setItem("eventLog", JSON.stringify([]));
            }
        }

        getLog() {
            try {
                const logData = this.useGM ? GM_getValue("eventLog") : localStorage.getItem("eventLog");
                return logData ? JSON.parse(logData) : [];
            } catch (error) {
                console.error("Ошибка при чтении лога:", error);
                return [];
            }
        }

        saveLog(log) {
            try {
                const limitedLog = log.slice(0, this.stateManager.getSetting('logSize'));
                const logString = JSON.stringify(limitedLog);

                if (this.useGM) {
                    GM_setValue("eventLog", logString);
                } else {
                    localStorage.setItem("eventLog", logString);
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
                    color: var(--color-text-primary);
                    background: var(--color-bg-secondary);
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
            let color = colors.default || '#607d8b';
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
                { key: 'freeReadyThreshold', label: 'Порог "Свободен" (сек):', desc: 'Время, после которого оператор считается готовым к перерыву', type: 'number' },
                { key: 'targetGroups', label: 'Группы для анализа (через запятую):', desc: 'Названия групп, которые будут анализироваться', type: 'text' },
                { key: 'reserveForQueue', label: 'Резерв операторов:', desc: 'Сколько свободных операторов оставлять на случай роста очереди', type: 'number' },
                { key: 'ignoreQueueIfFree', label: 'Игнорировать очередь до:', desc: 'Если есть свободные операторы, очередь до этого числа игнорируется', type: 'number' },
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
                background: var(--color-success);
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
            exclDesc.style.cssText = 'margin: 0 0 15px 0; color: var(--color-text-secondary); font-size: 14px;';
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
                input.type = 'text';
                input.id = `setting-${setting.key}`;

                if (setting.type === 'number') {
                    input.type = 'number';
                }

                const value = this.stateManager.getSetting(setting.key);
                if (Array.isArray(value)) {
                    input.value = value.join(', ');
                } else {
                    input.value = value;
                }

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
                'freeReadyThreshold', 'targetGroups', 'reserveForQueue', 'ignoreQueueIfFree',
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
                    } else if (Array.isArray(value)) {
                        element.value = value.join(', ');
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
                    'freeReadyThreshold', 'targetGroups', 'reserveForQueue', 'ignoreQueueIfFree',
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
                        } else if (key === 'targetGroups') {
                            value = element.value.split(',').map(s => s.trim()).filter(Boolean);
                        } else {
                            value = parseInt(element.value) || 0;
                            if (key === 'logSize' && value < 1) value = 100;
                        }
                        this.stateManager.saveSetting(key, value);
                    }
                });

                NotificationSystem.showToast('Настройки успешно сохранены', 'success', 3000);
                this.windowElement.style.display = 'none';

                // Обновляем панель перерывов
                if (window.breakAdvisor && window.breakAdvisor.update) {
                    setTimeout(() => window.breakAdvisor.update(), 500);
                }
            } catch (error) {
                NotificationSystem.showToast('Ошибка при сохранении настроек', 'error', 3000);
            }
        }

        resetSettings() {
            if (confirm('Сбросить все настройки к значениям по умолчанию?')) {
                if (this.stateManager.useGM) {
                    GM_deleteValue('freeReadyThreshold');
                    // и т.д.
                } else {
                    localStorage.clear();
                }
                this.stateManager.settings = this.stateManager.loadSettings();
                this.loadCurrentSettings();
                NotificationSystem.showToast('Настройки сброшены', 'success', 3000);
            }
        }
    }

    // ========================================================================
    // 8. СИСТЕМА МОНИТОРИНГА АЛЕРТОВ
    // ========================================================================
    class AlertMonitoringSystem {
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
                const replacements = {
                    'Чатов закрыто': 'Закрыто',
                    'Чатов в работе': 'В работе',
                    'Время статуса': 'Время',
                    'Статус оператора': 'Статус',
                    'Имя оператора': 'Оператор'
                };

                document.querySelectorAll('span, div, td, th, label').forEach(el => {
                    const originalText = el.textContent.trim();
                    if (replacements[originalText]) {
                        el.textContent = replacements[originalText];
                    }
                });
            } catch (error) {
                console.error('Ошибка при обновлении текстов:', error);
            }
        }
    }

    // ========================================================================
    // 9. СИСТЕМА АНАЛИЗА ПЕРЕРЫВОВ
    // ========================================================================
    class BreakAnalysisSystem {
        constructor(stateManager) {
            this.stateManager = stateManager;
            this.panelWrapper = null;
            this.panel = null;
            this.updateInterval = 15000;
        }

        init() {
            this.setupTextObserver();
            this.startPeriodicUpdate();
        }

        setupTextObserver() {
            let lastTextFound = false;
            let initDone = false;

            const checkPage = () => {
                const isTarget = Utils.isTargetPage();

                if (isTarget !== lastTextFound || !initDone) {
                    lastTextFound = isTarget;
                    initDone = true;

                    if (isTarget) {
                        console.log('✅ [BreakAnalysis] Текст найден, активируем панель');
                        setTimeout(() => this.update(), 500);
                    } else {
                        console.log('❌ [BreakAnalysis] Текст пропал, скрываем панель');
                        if (this.panelWrapper) {
                            this.panelWrapper.style.display = 'none';
                        }
                    }
                }
            };

            const observer = new MutationObserver(() => {
                checkPage();
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true,
                characterData: true,
                characterDataOldValue: true
            });

            // Initial check
            setTimeout(checkPage, 2000);

            // Fallback checks
            let attempts = 0;
            const maxAttempts = 10;
            const checkInterval = setInterval(() => {
                attempts++;
                if (Utils.isTargetPage()) {
                    clearInterval(checkInterval);
                    checkPage();
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                }
            }, 1000);

            // Additional check after 5 seconds
            setTimeout(checkPage, 5000);
        }

        startPeriodicUpdate() {
            setInterval(() => {
                if (Utils.isTargetPage()) {
                    this.update();
                }
            }, this.updateInterval);
        }

        update() {
            if (!Utils.isTargetPage()) {
                if (this.panelWrapper) {
                    this.panelWrapper.style.display = 'none';
                }
                return;
            }

            const created = this.createPanel();
            if (!created) return;

            const groups = this.parseData();
            if (!groups) {
                if (this.panel) {
                    this.panel.innerHTML = '<div class="break-error">❌ Таблицы не найдены</div>';
                }
                return;
            }

            const analysis = this.analyze(groups);
            if (analysis) {
                this.renderPanel(analysis);
            }
        }

        createPanel() {
            if (this.panelWrapper) {
                this.panelWrapper.remove();
                this.panelWrapper = null;
                this.panel = null;
            }

            const containers = document.querySelectorAll('.grid.gap-4.w-1\\/2');
            if (containers.length < 2) return false;

            const targetContainer = containers[1];

            this.panelWrapper = document.createElement('div');
            this.panelWrapper.className = 'break-panel-wrapper';

            this.panel = document.createElement('div');
            this.panel.id = 'break-advisor-panel';
            this.panel.className = 'break-panel';
            this.panel.innerHTML = '<div class="break-loading">⏳ Загрузка данных...</div>';

            this.panelWrapper.appendChild(this.panel);
            targetContainer.appendChild(this.panelWrapper);

            return true;
        }

        parseData() {
            const tables = document.querySelectorAll('table._table_g86u9_1');
            if (tables.length < 2) return null;

            const summaryTable = tables[0];
            const detailTable = tables[1];
            const groupMetrics = {};

            summaryTable.querySelectorAll('tr').forEach((row) => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 2) {
                    const name = cells[0].innerText.trim();
                    const queue = parseInt(cells[1].innerText.trim(), 10);
                    if (name && !isNaN(queue)) {
                        groupMetrics[name] = { queue };
                    }
                }
            });

            const groups = {};
            let currentGroup = null;

            detailTable.querySelectorAll('tr').forEach(row => {
                const header = row.querySelector('td[colspan="5"]');
                if (header) {
                    const rawText = header.innerText.trim().replace(/<!---->/g, '');
                    currentGroup = rawText.replace(/\s*Статистика\s*/g, '').trim();

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
                    const timeSec = Utils.parseTimeToSeconds(timeText);
                    const g = groups[currentGroup];
                    g.total++;

                    if (statusText.includes('Свободен')) {
                        if (timeSec > this.stateManager.getSetting('freeReadyThreshold')) {
                            g.freeReady++;
                        } else {
                            g.freeShort++;
                        }
                    } else if (statusText.includes('Разговаривает')) {
                        g.busy++;
                    } else if (statusText.includes('Выключен') || statusText.includes('Недоступен')) {
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

        analyze(groups) {
            if (!groups) return null;

            const result = {
                timestamp: Date.now(),
                groups: {},
                overall: { freeReady: 0, freeShort: 0, offline: 0, busy: 0, total: 0 }
            };

            const targetGroups = this.stateManager.getSetting('targetGroups');
            const reserveForQueue = this.stateManager.getSetting('reserveForQueue');
            const maxBreakQueue1to5 = this.stateManager.getSetting('maxBreakQueue1to5');
            const maxBreakQueue6to10 = this.stateManager.getSetting('maxBreakQueue6to10');
            const maxBreakQueue10plus = this.stateManager.getSetting('maxBreakQueue10plus');
            const ignoreQueueIfFree = this.stateManager.getSetting('ignoreQueueIfFree');

            for (const [name, data] of Object.entries(groups)) {
                if (!targetGroups.includes(name)) continue;

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

                if (effectiveQueue === 0) {
                    canRelease = Math.max(0, freeReady - reserveForQueue);
                    maxAllowed = canRelease;
                    action = canRelease > 0 ? `🔺 Можно отпустить ${canRelease}` : '✅ Оптимально';
                    actionClass = 'break-action-optimal';
                } else if (effectiveQueue >= 1 && effectiveQueue <= 5) {
                    maxAllowed = maxBreakQueue1to5;
                    if (offline === maxAllowed) {
                        action = '✅ Оптимально';
                        actionClass = 'break-action-optimal';
                    } else if (offline < maxAllowed) {
                        const need = maxAllowed - offline;
                        action = `🔺 Отпустить ${need} (до ${maxAllowed})`;
                        actionClass = 'break-action-optimal';
                    } else {
                        const excess = offline - maxAllowed;
                        action = `🔻 Вернуть ${excess} (до ${maxAllowed})`;
                        actionClass = excess <= 2 ? 'break-action-warning' : 'break-action-danger';
                    }
                } else if (effectiveQueue >= 6 && effectiveQueue <= 10) {
                    maxAllowed = maxBreakQueue6to10;
                    if (offline === maxAllowed) {
                        action = '✅ Оптимально';
                        actionClass = 'break-action-optimal';
                    } else if (offline < maxAllowed) {
                        const need = maxAllowed - offline;
                        action = `🔺 Отпустить ${need} (до ${maxAllowed})`;
                        actionClass = 'break-action-optimal';
                    } else {
                        const excess = offline - maxAllowed;
                        action = `🔻 Вернуть ${excess} (до ${maxAllowed})`;
                        actionClass = excess <= 2 ? 'break-action-warning' : 'break-action-danger';
                    }
                } else {
                    maxAllowed = maxBreakQueue10plus;
                    if (offline === maxAllowed) {
                        action = '✅ Оптимально';
                        actionClass = 'break-action-optimal';
                    } else if (offline < maxAllowed) {
                        const need = maxAllowed - offline;
                        action = `🔺 Отпустить ${need} (до ${maxAllowed})`;
                        actionClass = 'break-action-optimal';
                    } else {
                        const excess = offline - maxAllowed;
                        action = `🔻 Вернуть ${excess} (до ${maxAllowed})`;
                        actionClass = excess <= 2 ? 'break-action-warning' : 'break-action-danger';
                    }
                }

                result.groups[name] = {
                    queue,
                    effectiveQueue,
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

        renderPanel(analysis) {
            if (!analysis || !this.panel) return;

            const timeStr = new Date(analysis.timestamp).toLocaleTimeString('ru-RU');

            let html = `
                <div class="break-panel-header">
                    <span class="break-panel-title">Анализ перерывов</span>
                    <div class="break-panel-controls">
                        <span class="break-timestamp">🔄 ${timeStr}</span>
                        <span id="break-settings-btn" class="break-settings-btn" title="Настройки">⚙️</span>
                    </div>
                </div>
                <div class="break-grid">
            `;

            for (const [name, g] of Object.entries(analysis.groups)) {
                let cardClass = 'break-card break-card-queue-0';
                if (g.queue >= 10) cardClass = 'break-card break-card-queue-10';
                else if (g.queue >= 5) cardClass = 'break-card break-card-queue-5';

                let targetText;
                if (g.effectiveQueue === 0) {
                    targetText = g.canRelease > 0 ? g.offline + g.canRelease : this.stateManager.getSetting('maxBreakQueue1to5');
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
                            <span class="break-action-sub">${g.busy} в работе</span>
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

            this.panel.innerHTML = html;

            const settingsBtn = document.getElementById('break-settings-btn');
            if (settingsBtn && window.settingsSystem) {
                settingsBtn.addEventListener('click', () => {
                    window.settingsSystem.show();
                });
            }
        }
    }

    // ========================================================================
    // 10. ГЛАВНОЕ ПРИЛОЖЕНИЕ
    // ========================================================================
    class App {
        constructor() {
            this.stateManager = new StateManager();
            this.logSystem = new LogSystem(this.stateManager);
            this.logWindow = new LogWindow(this.stateManager, this.logSystem);
            this.settingsSystem = new SettingsSystem(this.stateManager, this.logSystem);
            this.alertMonitoring = new AlertMonitoringSystem(this.stateManager, this.logSystem);
            this.breakAnalysis = new BreakAnalysisSystem(this.stateManager);

            // Глобальные ссылки
            window.logSystem = this.logSystem;
            window.logWindow = this.logWindow;
            window.settingsSystem = this.settingsSystem;
            window.breakAdvisor = this.breakAnalysis;
        }

        init() {
            console.log('🚀 Мониторинг КЦ PRO запущен');

            // Инициализация уведомлений
            NotificationSystem.init(this.stateManager);

            // Запуск систем
            this.alertMonitoring.init();
            this.breakAnalysis.init();

            // Добавление стилей
            this.addStyles();

            // Логирование настроек
            console.log('📋 Текущие настройки:', {
                'Порог свободен': `${this.stateManager.getSetting('freeReadyThreshold')} сек`,
                'Группы': this.stateManager.getSetting('targetGroups'),
                'Резерв': this.stateManager.getSetting('reserveForQueue'),
                'Игнорировать очередь': this.stateManager.getSetting('ignoreQueueIfFree'),
                'Макс перерыв 0-5': this.stateManager.getSetting('maxBreakQueue1to5'),
                'Макс перерыв 6-10': this.stateManager.getSetting('maxBreakQueue6to10'),
                'Макс перерыв 10+': this.stateManager.getSetting('maxBreakQueue10plus'),
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
            if (document.getElementById('break-advisor-styles')) return;

            const styleEl = document.createElement('style');
            styleEl.id = 'break-advisor-styles';
            styleEl.textContent = STYLES;
            document.head.appendChild(styleEl);
        }
    }

    // ========================================================================
    // 11. ЗАПУСК
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