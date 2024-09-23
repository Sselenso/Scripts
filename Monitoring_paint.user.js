// ==UserScript==
// @name         Мониторинг чатов
// @namespace    http://tampermonkey.net/
// @version      2.5
// @description  Мониторинг чатов
// @match        https://ai.sknt.ru/monitoring_cc
// @updateURL    https://raw.githubusercontent.com/Sselenso/Scripts/main/Monitoring_paint.user.js
// @downloadURL  https://raw.githubusercontent.com/Sselenso/Scripts/main/Monitoring_paint.user.js
// ==/UserScript==

(function() {
    'use strict';

    window.addEventListener('load', function() {
        setTimeout(function() {
            let spans = document.querySelectorAll('span');

            spans.forEach(function(span) {
                if (span.textContent === 'Чатов закрыто') {
                    span.textContent = 'Закрыто';
                }
                if (span.textContent === 'Чатов в работе') {
                    span.textContent = 'В работе';
                }
                if (span.textContent === 'Время статуса') {
                    span.textContent = 'Время';
                }
            });

            const cells = document.querySelectorAll("td");

            cells.forEach(cell => {
                const textNodes = Array.from(cell.childNodes).filter(node => node.nodeType === Node.TEXT_NODE);

                textNodes.forEach(textNode => {
                    const textContent = textNode.textContent.trim();
                    if (textContent === "AO" || textContent === "ТехПо" || textContent === "Кантри 1 линия" || textContent === "Кантри ТехПо") {
                        cell.style.backgroundColor = "#58676e";
                        cell.style.borderRight = "none";
                    }
                });
            });

        }, 3000);
    });
})();
