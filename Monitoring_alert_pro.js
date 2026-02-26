// ==UserScript==
// @name         Мониторинг алерт и окрашивание чатов Pro 5.5
// @namespace    http://tampermonkey.net/
// @version      5.5
// @description  Мониторинг алертов и чатов с гибридными уведомлениями и журналом событий
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

    // ========== ГЛОБАЛЬНЫЕ КОНСТАНТЫ И ПЕРЕМЕННЫЕ ==========
    const STATUS = {
        TALKING: "Разговаривает",
        UNAVAILABLE: "Недоступен",
        DISABLED: "Выключен"
    };

    const ICONS = {
        [STATUS.TALKING]: "🗣️",
        [STATUS.UNAVAILABLE]: "❌",
        [STATUS.DISABLED]: "🔴"
    };

    const COLOR_SCHEMES = {
        TOAST: {
            warning: { bg: "#ff9800", border: "#f57c00", title: "⚠️ Внимание" },
            error: { bg: "#f44336", border: "#d32f2f", title: "❌ Ошибка" },
            success: { bg: "#4CAF50", border: "#388e3c", title: "✅ Успешно" },
            info: { bg: "#2196F3", border: "#1976d2", title: "ℹ️ Информация" }
        },
        LOG: {
            talking: "#ff9800",
            unavailable: "#f44336",
            disabled: "#9c27b0",
            default: "#607d8b"
        }
    };

    const DEFAULT_SETTINGS = {
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

    const COOLDOWNS = {
        talking: 300000,
        unavailable: 60000,
        disabled: 180000
    };

    const SELECTORS = {
        rows: "._tableRow_26gbz_1, .tcbf0bc.r4d22b2, tr[class*='tableRow'], table tr",
        cells: "._tableCell_1a192_1, .tf6e7cf.c0d3473, td[class*='tableCell'], td"
    };

    // ========== СИСТЕМА УПРАВЛЕНИЯ СОСТОЯНИЕМ ==========
    class StateManager {
        constructor() {
            this.notificationHistory = new Map();
            this.originalTitle = document.title;
            this.settings = this.loadSettings();
        }

        loadSettings() {
            const settings = { ...DEFAULT_SETTINGS };

            for (const [key, defaultValue] of Object.entries(DEFAULT_SETTINGS)) {
                const storageKey = key.charAt(0).toLowerCase() + key.slice(1);
                const stored = localStorage.getItem(storageKey);

                if (stored !== null) {
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
            const storageKey = key.charAt(0).toLowerCase() + key.slice(1);
            localStorage.setItem(storageKey, JSON.stringify(value));
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

    // ========== УТИЛИТЫ ==========
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

        parseTimeToSeconds(timeText) {
            if (!timeText) return 0;

            const match = timeText.match(/(\d+)\s*(мин|час|часа|часов|минут|минуты|минуту|мин\.?)\s*(\d+)?\s*(сек|секунд|секунды|сек\.?)?/i);
            if (!match) return 0;

            const value = parseInt(match[1]) || 0;
            const unit = (match[2] || "").toLowerCase();
            const seconds = parseInt(match[3]) || 0;

            if (unit.includes('час')) return value * 3600 + seconds;
            if (unit.includes('мин')) return value * 60 + seconds;
            return value;
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
        }
    };

    // ========== СИСТЕМА ЛОГИРОВАНИЯ ==========
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

    // ========== СИСТЕМА УВЕДОМЛЕНИЙ ==========
    class NotificationSystem {
        static toastContainer = null;
        static stateManager = null;

        static init(stateManager) {
            this.stateManager = stateManager;
            this.createToastSystem();
            this.requestNotificationPermission();
        }

        static createToastSystem() {
            if (this.toastContainer) return;

            this.toastContainer = Utils.createElement('div', {
                id: 'toast-container'
            }, {
                position: 'fixed',
                top: '60px',
                right: '20px',
                zIndex: '10000',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                maxWidth: '400px'
            });

            document.body.appendChild(this.toastContainer);

            if (!document.getElementById("toast-animations")) {
                const style = document.createElement('style');
                style.id = "toast-animations";
                style.textContent = `
                    @keyframes slideIn {
                        from { transform: translateX(100%); opacity: 0; }
                        to { transform: translateX(0); opacity: 1; }
                    }
                    @keyframes slideOut {
                        from { transform: translateX(0); opacity: 1; }
                        to { transform: translateX(100%); opacity: 0; }
                    }
                `;
                document.head.appendChild(style);
            }
        }

        static showToast(message, type = "warning", duration = 5000) {
            this.createToastSystem();

            const colorScheme = COLOR_SCHEMES.TOAST[type] || COLOR_SCHEMES.TOAST.info;

            const toast = Utils.createElement('div', {
                className: 'toast-notification'
            }, {
                background: colorScheme.bg,
                color: 'white',
                padding: '15px 20px',
                borderRadius: '8px',
                boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)',
                fontSize: '14px',
                lineHeight: '1.4',
                position: 'relative',
                animation: 'slideIn 0.3s ease-out',
                borderLeft: `4px solid ${colorScheme.border}`
            });

            const header = Utils.createElement('div', {}, {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
                fontWeight: '600'
            });

            const title = Utils.createElement('span', {}, {
                fontSize: '16px'
            }, [colorScheme.title]);

            const closeBtn = Utils.createElement('button', {}, {
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '0',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: '0.8'
            }, ['×']);

            closeBtn.addEventListener('click', () => this.removeToast(toast));

            header.appendChild(title);
            header.appendChild(closeBtn);

            const content = Utils.createElement('div');
            content.innerHTML = message;

            toast.appendChild(header);
            toast.appendChild(content);

            if (message.includes("🗣️") || message.includes("❌") || message.includes("🔴")) {
                // Извлекаем очищенное имя для исключений
                const cleanName = Utils.extractOperatorName(message);

                const excluded = this.stateManager.getSetting('excludedOperators');

                if (!excluded.includes(cleanName)) {
                    const excludeBtn = Utils.createElement('button', {}, {
                        marginTop: '10px',
                        padding: '6px 12px',
                        background: 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500',
                        display: 'block',
                        width: '100%'
                    }, ['🚫 Исключить']);

                    excludeBtn.addEventListener('click', () => {
                        excluded.push(cleanName);
                        this.stateManager.saveSetting('excludedOperators', excluded);
                        this.showToast(`Оператор "${cleanName}" добавлен в исключения`, "success", 3000);
                        this.removeToast(toast);
                    });

                    toast.appendChild(excludeBtn);
                }
            }

            this.toastContainer.appendChild(toast);
            setTimeout(() => this.removeToast(toast), duration);
            this.blinkTabTitle(type);

            if (this.stateManager.getSetting('soundEnabled')) {
                this.playSound();
            }
        }

        static removeToast(toast) {
            toast.style.animation = "slideOut 0.3s ease-out forwards";
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
                "warning": "⚠️ Внимание!",
                "error": "❌ Ошибка!",
                "success": "✅ Успешно!",
                "info": "ℹ️ Информация"
            };

            const blinkText = titles[type] || "⚠️ Внимание!";

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

        static showBrowserNotification(title, message, type = "warning") {
            if (!("Notification" in window) ||
                Notification.permission !== "granted" ||
                !this.stateManager.getSetting('useBrowserNotifications')) {
                return;
            }

            const isWindowVisible = document.visibilityState === 'visible';
            if (isWindowVisible && document.hasFocus()) {
                return;
            }

            const icon = this.getNotificationIcon(type);
            const options = {
                body: message,
                icon: icon,
                tag: 'monitoring-alert',
                requireInteraction: false,
                silent: false,
                vibrate: [200, 100, 200]
            };

            const notification = new Notification(title, options);

            notification.onclick = function(event) {
                event.preventDefault();
                window.focus();
                this.close();
            };

            setTimeout(() => notification.close(), 5000);
        }

        static getNotificationIcon(type) {
            const icons = {
                "warning": "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/26a0.svg",
                "error": "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/274c.svg",
                "success": "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/2705.svg",
                "info": "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/2139.svg"
            };
            return icons[type] || icons["info"];
        }

        static showHybridNotification(message, type = "warning") {
            const title = COLOR_SCHEMES.TOAST[type]?.title || "Уведомление";
            const now = Date.now();
            const notificationKey = `${type}_${message.substring(0, 50)}`;

            const lastTime = this.stateManager.getLastNotificationTime(notificationKey);
            if (lastTime && (now - lastTime < 60000)) {
                return;
            }

            this.stateManager.updateNotificationHistory(notificationKey, now);

            if (message.includes("🗣️") || message.includes("❌") || message.includes("🔴")) {
                window.logSystem.addEntry("alert", message, {
                    type: type,
                    source: "monitoring",
                    timestamp: now,
                    windowFocused: document.hasFocus()
                });
            }

            if (this.stateManager.getSetting('showToastInBrowser')) {
                this.showToast(message, type, 8000);
            }

            if (this.stateManager.getSetting('useBrowserNotifications') &&
                Notification.permission === "granted" &&
                !document.hasFocus()) {
                this.showBrowserNotification(title, message, type);
            }

            if (document.hasFocus()) {
                this.blinkTabTitle(type);
            }

            if (this.stateManager.getSetting('soundEnabled')) {
                this.playSound();
            }
        }

        static playSound() {
            try {
                const audio = new Audio("https://www.dropbox.com/scl/fi/exu5d8q0ms2bt7dyrrarg/mixkit-alert-bells-echo-765.wav?rlkey=4o1silnbmgnu14eey8iqyabxp&st=2sc2kq5j&raw=1");
                audio.volume = 0.5;
                audio.play().catch(() => {});
            } catch (error) {}
        }
    }

    // ========== ОКНО ЖУРНАЛА ==========
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
            this.windowElement = Utils.createElement('div', {
                id: 'logWindow'
            }, {
                display: 'none',
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '800px',
                height: '600px',
                background: '#fff',
                borderRadius: '8px',
                padding: '20px',
                zIndex: '9999',
                boxShadow: '0 5px 30px rgba(0, 0, 0, 0.3)',
                border: '1px solid #ddd',
                flexDirection: 'column'
            });

            const header = this.createHeader();
            const controls = this.createControls();
            const logContainer = Utils.createElement('div', {
                id: 'logContainer'
            }, {
                flex: '1',
                overflowY: 'auto',
                border: '1px solid #ddd',
                borderRadius: '4px',
                padding: '10px',
                background: '#fafafa'
            });

            const stats = Utils.createElement('div', {
                id: 'logStats'
            }, {
                marginTop: '15px',
                paddingTop: '15px',
                borderTop: '1px solid #eee',
                color: '#666',
                fontSize: '12px',
                display: 'flex',
                justifyContent: 'space-between'
            });

            this.windowElement.appendChild(header);
            this.windowElement.appendChild(controls);
            this.windowElement.appendChild(logContainer);
            this.windowElement.appendChild(stats);

            document.body.appendChild(this.windowElement);
        }

        createHeader() {
            const header = Utils.createElement('div', {}, {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                paddingBottom: '15px',
                borderBottom: '1px solid #eee'
            });

            const title = Utils.createElement('h2', {}, {
                margin: '0',
                color: '#333',
                fontSize: '20px',
                fontWeight: '600'
            }, ['📝 Журнал алертов']);

            const closeButton = Utils.createElement('span', {}, {
                fontSize: '28px',
                cursor: 'pointer',
                color: '#666',
                lineHeight: '1'
            }, ['×']);

            closeButton.addEventListener('click', () => {
                this.windowElement.style.display = 'none';
            });

            header.appendChild(title);
            header.appendChild(closeButton);
            return header;
        }

        createControls() {
            const controls = Utils.createElement('div', {}, {
                display: 'flex',
                gap: '10px',
                marginBottom: '15px'
            });

            const buttons = [
                { id: "markAllRead", text: "📌 Отметить все прочитанными", action: () => this.logSystem.markAllAsRead() },
                { id: "exportLog", text: "💾 Экспорт", action: () => this.logSystem.export() },
                { id: "clearLog", text: "🗑️ Очистить", action: () => this.logSystem.clear() }
            ];

            buttons.forEach(btn => {
                const button = Utils.createElement('button', {
                    id: btn.id
                }, {
                    padding: '8px 12px',
                    background: '#f5f5f5',
                    color: '#333',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                    flex: '1'
                }, [btn.text]);

                button.addEventListener('click', btn.action);
                controls.appendChild(button);
            });

            return controls;
        }

        show() {
            if (this.windowElement) {
                this.windowElement.style.display = "flex";
                this.updateUI();
            }
        }

        updateUI() {
            const logContainer = document.getElementById("logContainer");
            const stats = document.getElementById("logStats");

            if (!logContainer || !stats) return;

            try {
                const allLogs = this.logSystem.getLog();
                const filteredLogs = allLogs.filter(event =>
                    event.type === "alert" &&
                    (event.message.includes("🗣️") || event.message.includes("❌") || event.message.includes("🔴"))
                );

                if (filteredLogs.length === 0) {
                    stats.innerHTML = "Алертов: 0";
                    this.renderEmptyLog(logContainer);
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

        renderEmptyLog(container) {
            const emptyMessage = Utils.createElement('div', {
                id: 'logEmptyMessage'
            }, {
                textAlign: 'center',
                color: '#666',
                fontStyle: 'italic',
                padding: '40px'
            }, ['Журнал алертов пуст']);

            container.innerHTML = '';
            container.appendChild(emptyMessage);
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
                const dateSection = Utils.createElement('div', {}, {
                    marginBottom: '20px'
                });

                const dateHeader = Utils.createElement('div', {}, {
                    fontWeight: 'bold',
                    color: '#333',
                    background: '#e9e9e9',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    marginBottom: '10px',
                    fontSize: '14px',
                    position: 'sticky',
                    top: '0',
                    zIndex: '1'
                }, [date]);

                dateSection.appendChild(dateHeader);

                groupedByDate[date].forEach(event => {
                    const eventElement = this.createLogEventElement(event);
                    dateSection.appendChild(eventElement);
                });

                container.appendChild(dateSection);
            });
        }

        createLogEventElement(event) {
            const element = Utils.createElement('div', {
                id: `log-event-${event.id}`
            }, {
                display: 'flex',
                alignItems: 'flex-start',
                padding: '10px 12px',
                marginBottom: '8px',
                background: event.acknowledged ? '#fff' : '#f0f7ff',
                borderLeft: `3px solid ${this.getEventColor(event.message)}`,
                borderRadius: '4px',
                fontSize: '13px',
                transition: 'background 0.2s',
                cursor: 'pointer'
            });

            element.addEventListener('click', () => this.toggleEventRead(event.id));

            let icon = "📄";
            if (event.message.includes("🗣️")) icon = "🗣️";
            else if (event.message.includes("❌")) icon = "❌";
            else if (event.message.includes("🔴")) icon = "🔴";

            const iconDiv = Utils.createElement('div', {}, {
                marginRight: '10px',
                fontSize: '16px',
                minWidth: '20px'
            }, [icon]);

            const content = Utils.createElement('div', {}, {
                flex: '1',
                minWidth: '0'
            });

            const header = Utils.createElement('div', {}, {
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '4px'
            });

            const time = Utils.createElement('span', {}, {
                color: '#666',
                fontSize: '12px',
                fontWeight: '500'
            }, [event.timeDisplay || Utils.formatTime(new Date(event.timestamp))]);

            let alertType = "Алерт";
            if (event.message.includes("🗣️")) alertType = "Разговаривает";
            else if (event.message.includes("❌")) alertType = "Недоступен";
            else if (event.message.includes("🔴")) alertType = "Выключен";

            const typeBadge = Utils.createElement('span', {}, {
                background: this.getEventColor(event.message),
                color: 'white',
                padding: '2px 6px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: '500'
            }, [alertType]);

            const message = Utils.createElement('div', {}, {
                color: '#333',
                lineHeight: '1.4',
                wordBreak: 'break-word'
            }, [event.message.replace(/\s+/g, ' ').trim()]);

            header.appendChild(time);
            header.appendChild(typeBadge);
            content.appendChild(header);
            content.appendChild(message);

            element.appendChild(iconDiv);
            element.appendChild(content);

            return element;
        }

        getEventColor(message) {
            if (message.includes("🗣️")) return COLOR_SCHEMES.LOG.talking;
            if (message.includes("❌")) return COLOR_SCHEMES.LOG.unavailable;
            if (message.includes("🔴")) return COLOR_SCHEMES.LOG.disabled;
            return COLOR_SCHEMES.LOG.default;
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
                console.error("Ошибка при обновлении события:", error);
            }
        }
    }

    // ========== СИСТЕМА НАСТРОЕК ==========
    class SettingsSystem {
        constructor(stateManager) {
            this.stateManager = stateManager;
            this.windowElement = null;
            this.activeTab = "tab-main";
            this.init();
        }

        init() {
            this.createSettingsButton();
            this.createSettingsWindow();
        }

        createSettingsButton() {
            if (document.getElementById("settingsButton")) return;

            const settingsButton = Utils.createElement('button', {
                id: 'settingsButton'
            }, {
                position: 'fixed',
                top: '10px',
                right: '460px',
                zIndex: '9998',
                padding: '8px 16px',
                background: '#f5f5f5',
                color: '#333',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
            }, ['Настройки']);

            settingsButton.addEventListener('click', () => this.show());
            document.body.appendChild(settingsButton);
        }

        createSettingsWindow() {
            if (document.getElementById("settingsWindow")) return;

            this.windowElement = Utils.createElement('div', {
                id: 'settingsWindow'
            }, {
                display: 'none',
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '500px',
                background: '#fff',
                borderRadius: '8px',
                padding: '20px',
                zIndex: '9999',
                boxShadow: '0 5px 20px rgba(0, 0, 0, 0.15)',
                border: '1px solid #ddd',
                maxHeight: '80vh',
                overflowY: 'auto'
            });

            this.createWindowContent();
            document.body.appendChild(this.windowElement);
        }

        createWindowContent() {
            const closeButton = Utils.createElement('span', {}, {
                position: 'absolute',
                top: '15px',
                right: '15px',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666'
            }, ['×']);

            closeButton.addEventListener('click', () => {
                this.windowElement.style.display = 'none';
            });

            const title = Utils.createElement('h2', {}, {
                margin: '0 0 20px 0',
                color: '#333',
                fontSize: '20px',
                fontWeight: '600'
            }, ['Настройки мониторинга']);

            const tabsContainer = this.createTabs();
            const tabContents = Utils.createElement('div', {
                id: 'tabContents'
            });

            this.windowElement.appendChild(closeButton);
            this.windowElement.appendChild(title);
            this.windowElement.appendChild(tabsContainer);
            this.windowElement.appendChild(tabContents);

            this.createTabContents(tabContents);
            this.createActionButtons();
        }

        createTabs() {
            const tabsContainer = Utils.createElement('div', {}, {
                display: 'flex',
                borderBottom: '1px solid #ddd',
                marginBottom: '20px'
            });

            const tabButtons = [
                { id: "tab-main", text: "Основные" },
                { id: "tab-notifications", text: "Уведомления" },
                { id: "tab-log", text: "Журнал" },
                { id: "tab-exclusions", text: "Исключения" }
            ];

            tabButtons.forEach(tab => {
                const tabButton = Utils.createElement('button', {
                    id: tab.id
                }, {
                    padding: '10px 20px',
                    background: this.activeTab === tab.id ? '#2196F3' : 'transparent',
                    color: this.activeTab === tab.id ? 'white' : '#333',
                    border: 'none',
                    borderBottom: `2px solid ${this.activeTab === tab.id ? '#2196F3' : 'transparent'}`,
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    flex: '1'
                }, [tab.text]);

                tabButton.addEventListener('click', () => this.switchTab(tab.id));
                tabsContainer.appendChild(tabButton);
            });

            return tabsContainer;
        }

        createTabContents(container) {
            this.createMainTab(container);
            this.createNotificationsTab(container);
            this.createLogTab(container);
            this.createExclusionsTab(container);
        }

        createMainTab(container) {
            const content = Utils.createElement('div', {
                id: 'tab-main-content'
            }, {
                display: this.activeTab === "tab-main" ? "block" : "none"
            });

            const settings = [
                {
                    type: "number",
                    id: "conversationTimeInput",
                    label: "Максимальное время разговора",
                    value: this.stateManager.getSetting('conversationTime'),
                    suffix: "сек",
                    desc: "По умолчанию: 900 сек (15 мин)"
                },
                {
                    type: "checkbox",
                    id: "unavailableCheckbox",
                    label: "Проверять статус 'Недоступен'",
                    value: this.stateManager.getSetting('unavailableEnabled')
                },
                {
                    type: "number",
                    id: "unavailableTimeInput",
                    label: "Время статуса 'Недоступен'",
                    value: this.stateManager.getSetting('unavailableTime'),
                    suffix: "сек",
                    desc: "По умолчанию: 30 сек"
                },
                {
                    type: "checkbox",
                    id: "disabledCheckbox",
                    label: "Проверять статус 'Выключен'",
                    value: this.stateManager.getSetting('disabledEnabled')
                },
                {
                    type: "number",
                    id: "disabledTimeInput",
                    label: "Время статуса 'Выключен'",
                    value: this.stateManager.getSetting('disabledTime'),
                    suffix: "сек",
                    desc: "По умолчанию: 1200 сек (20 мин)"
                }
            ];

            settings.forEach(setting => {
                const row = this.createSettingRow(setting);
                content.appendChild(row);
            });

            container.appendChild(content);
        }

        createNotificationsTab(container) {
            const content = Utils.createElement('div', {
                id: 'tab-notifications-content'
            }, {
                display: this.activeTab === "tab-notifications" ? "block" : "none"
            });

            const title = Utils.createElement('h3', {}, {
                margin: '0 0 15px 0',
                color: '#333',
                fontSize: '16px',
                fontWeight: '600'
            }, ['Настройки уведомлений']);

            const permissionButton = Utils.createElement('button', {
                id: 'permissionButton'
            }, {
                marginBottom: '20px',
                padding: '10px 16px',
                background: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'block',
                width: '100%'
            });

            this.updatePermissionButtonText(permissionButton);
            permissionButton.addEventListener('click', () => this.managePermissions());

            const settings = [
                {
                    type: "checkbox",
                    id: "soundCheckbox",
                    label: "Звуковые уведомления",
                    value: this.stateManager.getSetting('soundEnabled'),
                    desc: "Воспроизводить звук при алерте"
                },
                {
                    type: "checkbox",
                    id: "toastInBrowserCheckbox",
                    label: "Toast-уведомления в браузере",
                    value: this.stateManager.getSetting('showToastInBrowser'),
                    desc: "Показывать всплывающие уведомления в правом углу"
                },
                {
                    type: "checkbox",
                    id: "browserNotificationsCheckbox",
                    label: "Браузерные уведомления",
                    value: this.stateManager.getSetting('useBrowserNotifications'),
                    desc: "Показывать системные уведомления только когда браузер свернут или окно не активно"
                }
            ];

            content.appendChild(title);
            content.appendChild(permissionButton);

            settings.forEach(setting => {
                const row = this.createSettingRow(setting);
                content.appendChild(row);
            });

            container.appendChild(content);
        }

        createLogTab(container) {
            const content = Utils.createElement('div', {
                id: 'tab-log-content'
            }, {
                display: this.activeTab === "tab-log" ? "block" : "none"
            });

            const title = Utils.createElement('h3', {}, {
                margin: '0 0 15px 0',
                color: '#333',
                fontSize: '16px',
                fontWeight: '600'
            }, ['Настройки журнала алертов']);

            const settings = [
                {
                    type: "checkbox",
                    id: "logCheckbox",
                    label: "Вести журнал алертов",
                    value: this.stateManager.getSetting('logEnabled'),
                    desc: "Записывать только алерты (разговаривает/выключен/недоступен) в журнал"
                },
                {
                    type: "number",
                    id: "logSizeInput",
                    label: "Максимальное количество записей",
                    value: this.stateManager.getSetting('logSize'),
                    suffix: "шт",
                    desc: "По умолчанию: 100 записей. Старые записи будут удаляться."
                }
            ];

            content.appendChild(title);

            settings.forEach(setting => {
                const row = this.createSettingRow(setting);
                content.appendChild(row);
            });

            const openLogButton = Utils.createElement('button', {}, {
                marginTop: '20px',
                padding: '10px 16px',
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'block',
                width: '100%'
            }, ['📝 Открыть журнал алертов']);

            openLogButton.addEventListener('click', () => {
                this.windowElement.style.display = "none";
                window.logWindow.show();
            });

            content.appendChild(openLogButton);
            container.appendChild(content);
        }

        createExclusionsTab(container) {
            const content = Utils.createElement('div', {
                id: 'tab-exclusions-content'
            }, {
                display: this.activeTab === "tab-exclusions" ? "block" : "none"
            });

            const title = Utils.createElement('h3', {}, {
                margin: '0 0 15px 0',
                color: '#333',
                fontSize: '16px',
                fontWeight: '600'
            }, ['Управление исключениями']);

            const description = Utils.createElement('p', {}, {
                margin: '0 0 15px 0',
                color: '#666',
                fontSize: '14px'
            }, ['Операторы в этом списке не будут проверяться системой мониторинга.']);

            const inputContainer = Utils.createElement('div', {}, {
                display: 'flex',
                gap: '10px',
                marginBottom: '20px'
            });

            const input = Utils.createElement('input', {
                type: 'text',
                id: 'excludeInput',
                placeholder: 'Введите имя оператора (без номера)'
            }, {
                flex: '1',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
            });

            const addButton = Utils.createElement('button', {}, {
                padding: '8px 16px',
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
            }, ['Добавить']);

            addButton.addEventListener('click', () => this.addExclusion(input));

            const exclusionsList = Utils.createElement('div', {
                id: 'exclusionsList'
            }, {
                maxHeight: '200px',
                overflowY: 'auto',
                border: '1px solid #ddd',
                borderRadius: '4px',
                padding: '10px'
            });

            inputContainer.appendChild(input);
            inputContainer.appendChild(addButton);
            content.appendChild(title);
            content.appendChild(description);
            content.appendChild(inputContainer);
            content.appendChild(exclusionsList);

            container.appendChild(content);
            this.updateExclusionsList();
        }

        createSettingRow(setting) {
            const row = Utils.createElement('div', {}, {
                marginBottom: '15px'
            });

            if (setting.type === "checkbox") {
                const label = Utils.createElement('label', {}, {
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer'
                });

                const checkbox = Utils.createElement('input', {
                    type: 'checkbox',
                    id: setting.id
                }, {
                    marginRight: '10px',
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer'
                });

                checkbox.checked = setting.value;

                const text = Utils.createElement('span', {}, {
                    fontSize: '14px',
                    color: '#333'
                }, [setting.label]);

                label.appendChild(checkbox);
                label.appendChild(text);
                row.appendChild(label);
            } else {
                const label = Utils.createElement('label', {}, {
                    display: 'block',
                    marginBottom: '5px',
                    color: '#333',
                    fontSize: '14px',
                    fontWeight: '500'
                }, [setting.label]);

                const inputContainer = Utils.createElement('div', {}, {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                });

                const input = Utils.createElement('input', {
                    type: setting.type,
                    id: setting.id
                }, {
                    flex: '1',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                });

                input.value = setting.value;

                if (setting.suffix) {
                    const suffix = Utils.createElement('span', {}, {
                        color: '#666',
                        fontSize: '14px',
                        minWidth: '40px'
                    }, [setting.suffix]);
                    inputContainer.appendChild(suffix);
                }

                inputContainer.appendChild(input);
                row.appendChild(label);
                row.appendChild(inputContainer);
            }

            if (setting.desc) {
                const desc = Utils.createElement('div', {}, {
                    marginTop: '5px',
                    color: '#666',
                    fontSize: '12px',
                    fontStyle: 'italic'
                }, [setting.desc]);
                row.appendChild(desc);
            }

            return row;
        }

        createActionButtons() {
            const buttonDiv = Utils.createElement('div', {}, {
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                marginTop: '20px',
                paddingTop: '20px',
                borderTop: '1px solid #eee'
            });

            const resetButton = Utils.createElement('button', {}, {
                padding: '8px 16px',
                background: '#f5f5f5',
                color: '#333',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
            }, ['Сброс']);

            resetButton.addEventListener('click', () => this.resetSettings());

            const applyButton = Utils.createElement('button', {}, {
                padding: '8px 16px',
                background: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
            }, ['Применить']);

            applyButton.addEventListener('click', () => this.applySettings());

            buttonDiv.appendChild(resetButton);
            buttonDiv.appendChild(applyButton);
            this.windowElement.appendChild(buttonDiv);
        }

        switchTab(tabId) {
            this.activeTab = tabId;

            document.querySelectorAll("#settingsWindow button[id^='tab-']").forEach(btn => {
                const isActive = btn.id === tabId;
                btn.style.background = isActive ? '#2196F3' : 'transparent';
                btn.style.color = isActive ? 'white' : '#333';
                btn.style.borderBottom = isActive ? '2px solid #2196F3' : '2px solid transparent';
            });

            document.querySelectorAll("#tabContents > div").forEach(content => {
                content.style.display = content.id === `${tabId}-content` ? 'block' : 'none';
            });
        }

        show() {
            if (this.windowElement) {
                this.windowElement.style.display = "block";
                this.loadCurrentSettings();

                const permissionButton = document.getElementById("permissionButton");
                if (permissionButton) {
                    this.updatePermissionButtonText(permissionButton);
                }

                this.updateExclusionsList();
            }
        }

        loadCurrentSettings() {
            const settings = [
                { id: 'conversationTimeInput', value: this.stateManager.getSetting('conversationTime') },
                { id: 'unavailableCheckbox', value: this.stateManager.getSetting('unavailableEnabled') },
                { id: 'unavailableTimeInput', value: this.stateManager.getSetting('unavailableTime') },
                { id: 'disabledCheckbox', value: this.stateManager.getSetting('disabledEnabled') },
                { id: 'disabledTimeInput', value: this.stateManager.getSetting('disabledTime') },
                { id: 'soundCheckbox', value: this.stateManager.getSetting('soundEnabled') },
                { id: 'toastInBrowserCheckbox', value: this.stateManager.getSetting('showToastInBrowser') },
                { id: 'browserNotificationsCheckbox', value: this.stateManager.getSetting('useBrowserNotifications') },
                { id: 'logCheckbox', value: this.stateManager.getSetting('logEnabled') },
                { id: 'logSizeInput', value: this.stateManager.getSetting('logSize') }
            ];

            settings.forEach(setting => {
                const element = document.getElementById(setting.id);
                if (element) {
                    if (element.type === 'checkbox') {
                        element.checked = setting.value;
                    } else {
                        element.value = setting.value;
                    }
                }
            });
        }

        updatePermissionButtonText(button) {
            if (!button) return;

            let statusText = "Управление разрешениями";
            if ("Notification" in window) {
                switch (Notification.permission) {
                    case "granted": statusText = "✅ Уведомления разрешены"; break;
                    case "denied": statusText = "❌ Уведомления заблокированы"; break;
                    case "default": statusText = "⚙️ Запросить разрешения"; break;
                }
            } else {
                statusText = "❌ Браузер не поддерживает";
            }
            button.textContent = statusText;
        }

        managePermissions() {
            if (!("Notification" in window)) {
                NotificationSystem.showToast("Ваш браузер не поддерживает уведомления", "error", 3000);
                return;
            }

            switch (Notification.permission) {
                case "default":
                    Notification.requestPermission().then(permission => {
                        if (permission === "granted") {
                            if (!document.hasFocus()) {
                                NotificationSystem.showBrowserNotification(
                                    "✅ Уведомления включены",
                                    "Система будет показывать уведомления, когда окно свернуто или не активно",
                                    "success"
                                );
                            }
                            NotificationSystem.showToast("Разрешение на уведомления получено!", "success", 3000);
                        }
                        const permissionButton = document.getElementById("permissionButton");
                        if (permissionButton) this.updatePermissionButtonText(permissionButton);
                    });
                    break;
                case "granted":
                    const statusMessage = `Уведомления разрешены. Окно ${document.hasFocus() ? 'в фокусе' : 'не в фокусе'}. ` +
                                         `Уведомления будут показываться только когда окно не активно.`;
                    NotificationSystem.showToast(statusMessage, "info", 4000);
                    break;
                case "denied":
                    NotificationSystem.showToast("Уведомления заблокированы. Разрешите в настройках браузера", "error", 5000);
                    break;
            }
        }

        addExclusion(input) {
            const name = input.value.trim();
            if (!name) return;

            const excludedOperators = this.stateManager.getSetting('excludedOperators');
            if (!excludedOperators.includes(name)) {
                excludedOperators.push(name);
                this.stateManager.saveSetting('excludedOperators', excludedOperators);
                this.updateExclusionsList();
                input.value = "";
                NotificationSystem.showToast(`"${name}" добавлен в исключения`, "success", 3000);
            }
        }

        updateExclusionsList() {
            const list = document.getElementById("exclusionsList");
            if (!list) return;

            const excludedOperators = this.stateManager.getSetting('excludedOperators');

            if (excludedOperators.length === 0) {
                list.innerHTML = '';
                const emptyMsg = Utils.createElement('div', {}, {
                    color: '#666',
                    fontStyle: 'italic',
                    textAlign: 'center',
                    padding: '20px'
                }, ['Список исключений пуст']);
                list.appendChild(emptyMsg);
                return;
            }

            list.innerHTML = '';
            excludedOperators.forEach((operator, index) => {
                const item = Utils.createElement('div', {}, {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderBottom: '1px solid #eee',
                    fontSize: '14px'
                });

                const name = Utils.createElement('span', {}, {}, [operator]);

                const removeButton = Utils.createElement('button', {}, {
                    padding: '4px 8px',
                    background: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500'
                }, ['Удалить']);

                removeButton.addEventListener('click', () => {
                    excludedOperators.splice(index, 1);
                    this.stateManager.saveSetting('excludedOperators', excludedOperators);
                    this.updateExclusionsList();
                    NotificationSystem.showToast(`"${operator}" удален из исключений`, "info", 3000);
                });

                item.appendChild(name);
                item.appendChild(removeButton);
                list.appendChild(item);
            });
        }

        applySettings() {
            try {
                const settings = [
                    { key: 'conversationTime', elementId: 'conversationTimeInput', type: 'number' },
                    { key: 'unavailableEnabled', elementId: 'unavailableCheckbox', type: 'checkbox' },
                    { key: 'unavailableTime', elementId: 'unavailableTimeInput', type: 'number' },
                    { key: 'disabledEnabled', elementId: 'disabledCheckbox', type: 'checkbox' },
                    { key: 'disabledTime', elementId: 'disabledTimeInput', type: 'number' },
                    { key: 'soundEnabled', elementId: 'soundCheckbox', type: 'checkbox' },
                    { key: 'showToastInBrowser', elementId: 'toastInBrowserCheckbox', type: 'checkbox' },
                    { key: 'useBrowserNotifications', elementId: 'browserNotificationsCheckbox', type: 'checkbox' },
                    { key: 'logEnabled', elementId: 'logCheckbox', type: 'checkbox' },
                    { key: 'logSize', elementId: 'logSizeInput', type: 'number' }
                ];

                settings.forEach(setting => {
                    const element = document.getElementById(setting.elementId);
                    if (element) {
                        let value;
                        if (setting.type === 'checkbox') {
                            value = element.checked;
                        } else {
                            value = parseInt(element.value) || DEFAULT_SETTINGS[setting.key];
                        }
                        this.stateManager.saveSetting(setting.key, value);
                    }
                });

                NotificationSystem.showToast("Настройки успешно сохранены", "success", 3000);
                this.windowElement.style.display = "none";
            } catch (error) {
                NotificationSystem.showToast("Ошибка при сохранении настроек", "error", 3000);
            }
        }

        resetSettings() {
            NotificationSystem.showToast("Сбросить все настройки к значениям по умолчанию?", "warning", 10000);

            const lastToast = document.querySelector('#toast-container .toast-notification:last-child');
            if (lastToast) {
                const confirmBtn = Utils.createElement('button', {}, {
                    marginTop: '10px',
                    padding: '6px 12px',
                    background: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500',
                    display: 'block',
                    width: '100%'
                }, ['Да, сбросить']);

                confirmBtn.addEventListener('click', () => {
                    localStorage.clear();
                    window.logSystem.saveLog([]);
                    NotificationSystem.showToast("Настройки сброшены к значениям по умолчанию", "success", 3000);
                    setTimeout(() => location.reload(), 1500);
                });

                lastToast.appendChild(confirmBtn);
            }
        }
    }

    // ========== СИСТЕМА МОНИТОРИНГА ==========
    class MonitoringSystem {
        constructor(stateManager) {
            this.stateManager = stateManager;
            this.specialTexts = ["AO", "ТехПо", "Кантри 1 линия", "Кантри ТехПо"];
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
            this.checkCellTime();
            setInterval(() => this.checkCellTime(), 15000);
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

        checkCellTime() {
            try {
                let rows = document.querySelectorAll(SELECTORS.rows);
                if (rows.length === 0) {
                    const tables = document.querySelectorAll("table");
                    if (tables.length > 0) {
                        rows = tables[0].querySelectorAll("tr");
                    }
                }

                if (rows.length === 0) return;

                const now = Date.now();
                rows.forEach((row, index) => {
                    this.processRow(row, index, now);
                });
            } catch (error) {
                console.error("Ошибка при проверке ячеек:", error);
            }
        }

        processRow(row, index, now) {
            try {
                let cells = row.querySelectorAll(SELECTORS.cells);
                if (cells.length >= 4) {
                    const nameCell = cells[0];
                    const statusCell = cells[2];
                    const timeCell = cells[3];

                    const name = nameCell?.textContent?.trim() || `Строка ${index + 1}`;
                    const status = statusCell?.textContent?.trim() || "";
                    const timeText = timeCell?.textContent?.trim() || "";

                    if (this.specialTexts.includes(name) || name === "ИТОГО") {
                        return;
                    }

                    // Очищаем имя для проверки исключений
                    const cleanName = Utils.extractOperatorName(name);
                    const excludedOperators = this.stateManager.getSetting('excludedOperators');

                    // Делаем проверку без дополнительной очистки
                    if (excludedOperators.includes(cleanName)) {
                        return;
                    }

                    const totalSeconds = Utils.parseTimeToSeconds(timeText);
                    const statusType = this.getStatusType(status);
                    const icon = ICONS[statusType] || "";

                    if (statusType) {
                        this.checkAlertConditions(name, cleanName, statusType, timeText, totalSeconds, icon, now);
                    }
                }
            } catch (error) {
                console.error("Ошибка при обработке строки:", error);
            }
        }

        checkAlertConditions(fullName, cleanName, statusType, timeText, totalSeconds, icon, now) {
            const excludedOperators = this.stateManager.getSetting('excludedOperators');

            // Дополнительная проверка (на всякий случай)
            if (excludedOperators.includes(cleanName)) {
                return;
            }

            const checkAndAlert = (condition, toastType, cooldownKey) => {
                if (condition) {
                    const lastAlert = this.stateManager.getLastNotificationTime(fullName);
                    if (!lastAlert || now - lastAlert > COOLDOWNS[cooldownKey]) {
                        const message = `${icon} ${fullName} - ${statusType.toLowerCase()} ${timeText}`;
                        NotificationSystem.showHybridNotification(message, toastType);
                        this.stateManager.updateNotificationHistory(fullName, now);
                        return true;
                    }
                }
                return false;
            };

            switch (statusType) {
                case STATUS.TALKING:
                    if (totalSeconds > this.stateManager.getSetting('conversationTime')) {
                        checkAndAlert(true, "warning", "talking");
                    }
                    break;
                case STATUS.UNAVAILABLE:
                    if (this.stateManager.getSetting('unavailableEnabled') &&
                        totalSeconds > this.stateManager.getSetting('unavailableTime')) {
                        checkAndAlert(true, "error", "unavailable");
                    }
                    break;
                case STATUS.DISABLED:
                    if (this.stateManager.getSetting('disabledEnabled') &&
                        totalSeconds > this.stateManager.getSetting('disabledTime')) {
                        checkAndAlert(true, "warning", "disabled");
                    }
                    break;
            }
        }

        getStatusType(status) {
            if (status.includes(STATUS.TALKING)) return STATUS.TALKING;
            if (status.includes(STATUS.UNAVAILABLE)) return STATUS.UNAVAILABLE;
            if (status.includes(STATUS.DISABLED)) return STATUS.DISABLED;
            return null;
        }

        colorSpecialCells() {
            try {
                document.querySelectorAll("td, th").forEach(cell => {
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
                console.error("Ошибка при окрашивании ячеек:", error);
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
                console.error("Ошибка при обновлении текстов:", error);
            }
        }
    }

    // ========== ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ ==========
    class App {
        constructor() {
            this.stateManager = new StateManager();
            this.logSystem = new LogSystem(this.stateManager);
            this.logWindow = null;
            this.settingsSystem = null;
            this.monitoringSystem = null;
        }

        init() {
            console.log('Мониторинг запущен');

            // Инициализация систем
            NotificationSystem.init(this.stateManager);

            this.logWindow = new LogWindow(this.stateManager, this.logSystem);
            window.logWindow = this.logWindow;
            window.logSystem = this.logSystem;

            this.settingsSystem = new SettingsSystem(this.stateManager);
            this.monitoringSystem = new MonitoringSystem(this.stateManager);

            // Запуск мониторинга
            this.monitoringSystem.init();

            // Логирование текущих настроек
            console.log('Текущие настройки:', {
                conversationTime: `${this.stateManager.getSetting('conversationTime')} сек`,
                unavailable: `${this.stateManager.getSetting('unavailableEnabled') ? 'вкл' : 'выкл'} (${this.stateManager.getSetting('unavailableTime')} сек)`,
                выключен: `${this.stateManager.getSetting('disabledEnabled') ? 'вкл' : 'выкл'} (${this.stateManager.getSetting('disabledTime')} сек)`,
                звук: this.stateManager.getSetting('soundEnabled') ? 'вкл' : 'выкл',
                toast: this.stateManager.getSetting('showToastInBrowser') ? 'вкл' : 'выкл',
                browserNotifications: `${this.stateManager.getSetting('useBrowserNotifications') ? 'вкл' : 'выкл'} (разрешение: ${Notification.permission})`,
                log: `${this.stateManager.getSetting('logEnabled') ? 'вкл' : 'выкл'} (размер: ${this.stateManager.getSetting('logSize')})`,
                исключения: this.stateManager.getSetting('excludedOperators')
            });
        }
    }

    // Запуск приложения
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