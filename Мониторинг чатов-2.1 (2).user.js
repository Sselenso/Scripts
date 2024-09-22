// ==UserScript==
// @name         Мониторинг чатов
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  Мониторинг чатов
// @match        https://ai.sknt.ru/monitoring_cc
// @match        https://ai.sknt.ru/monitoring_cc
// @require      https://unpkg.com/axios/dist/axios.min.js
// @updateURL    https://raw.githubusercontent.com/Sselenso/site/main/Monitoring.user.js
// @downloadURL  https://raw.githubusercontent.com/Sselenso/site/main/Monitoring.user.js
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
                    if (textContent === "AO" || textContent === "ТехПо") {
                       cell.style.backgroundColor = "#58676e";
                       cell.style.borderRight = "none";

                    }
                });
            });






           
            let gridElements = document.querySelectorAll('.grid.gap-4.flex-1');

            if (gridElements && gridElements.length > 1) {
               
                let targetElement = gridElements[1];
               
                let gridMonitoring = document.createElement('div');
                gridMonitoring.style.display = 'grid';
                gridMonitoring.style.fontSize = '14px';
                gridMonitoring.style.gridTemplateColumns = 'auto auto auto minmax(135px, auto)';
                gridMonitoring.style.borderColor = '#e7e7e7';
                gridMonitoring.style.borderWidth = '1px';                
                targetElement.appendChild(gridMonitoring);

/*
    let gridMonitoring = document.createElement('div');
    gridMonitoring.style.display = 'grid';
    gridMonitoring.style.fontSize = '14px';
    gridMonitoring.style.gridTemplateColumns = 'auto auto auto minmax(135px, auto)';
    gridMonitoring.style.borderColor = '#e7e7e7';
    gridMonitoring.style.borderWidth = '1px';
    gridMonitoring.style.position = 'absolute';
    gridMonitoring.style.right = '20px';
    gridMonitoring.style.top = '557px';
    gridMonitoring.style.width = '41%';
    document.body.appendChild(gridMonitoring);

    */

    let headerName = document.createElement('div');
    let headerChatsCount = document.createElement('div');
    let headerStatus = document.createElement('div');
    let headerTimer = document.createElement('div');

    let headers = [headerName, headerChatsCount, headerStatus, headerTimer];
    let headerTextContents = ['Оператор', 'В руке', 'Статус', 'Время'];

    headers.forEach((header, index) => {
        header.classList.add('chats-header');
        header.style.backgroundColor = '#94ABB7';
        header.style.color = '#fff';
        header.style.fontWeight = 'bold';
        header.style.borderStyle = 'solid';
        header.style.borderWidth = '1px 1px';
        header.style.borderLeft = 'none';
        header.style.padding = '6px 10px';
        header.textContent = headerTextContents[index];
        gridMonitoring.appendChild(header);
    });

    headers[headers.length - 1].style.borderRight = 'none';

    let chattersRow = document.createElement('div');
    chattersRow.textContent = 'Чатеры';
    chattersRow.classList.add('type-work');
    chattersRow.style.gridColumn = '1 / -1';
    chattersRow.style.textAlign = 'center';
    chattersRow.style.backgroundColor = '#94ABB7';
    chattersRow.style.color = '#fff';
    chattersRow.style.fontWeight = 'bold';
    chattersRow.style.padding = '3px 0 5px 0';
    gridMonitoring.appendChild(chattersRow);



    let timers = JSON.parse(localStorage.getItem('timers') || '{}');

     const getStatusId = (chatsCount) => {
        if (chatsCount === 0) return 1;
        if (chatsCount >= 1 && chatsCount <= 5) return 2;
        return 3;
    };

    const getStatusText = (statusId) => {
        switch (statusId) {
            case 1: return 'Выключен';
            case 2: return 'Свободен';
            case 3: return 'Занят';
            default: return 'Неизвестен';
        }
    };

    const updateBackground = (elems, statusId) => {
        const colors = {
            1: '#ffdede',
            2: '#fff',
            3: '#cdffcd'
        };
        elems.forEach((elem) => {
            elem.style.backgroundColor = colors[statusId] || 'transparent';
        });
    };

      const formatTime = (startTime) => {
        let millisec = Date.now() - startTime;
        let totalSeconds = Math.floor(millisec / 1000);
        let minutes = Math.floor(totalSeconds / 60);
        let seconds = totalSeconds % 60;
        return `${minutes} мин. ${seconds} сек.`;
    };

    const resetTimers = () => {
        const lastResetTimestamp = localStorage.getItem('lastResetTimestamp');
        const now = new Date();
        const sixAMToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 6, 0, 0);


        if (!lastResetTimestamp || (lastResetTimestamp < sixAMToday.getTime() && now >= sixAMToday)) {
            localStorage.setItem('timers', '{}');
            localStorage.setItem('lastResetTimestamp', now.getTime());
            timers = {};
        }
    };


    const fetchAndDisplayData = () => {
        resetTimers();

        axios.get('https://ai.sknt.ru/genisys/ai/chats/operators')
            .then(function (response) {
                while (gridMonitoring.children.length > 5) {
                   gridMonitoring.removeChild(gridMonitoring.lastChild);
                }
                response.data.data.forEach((item, index, array) => {
                    let currentStatusId = getStatusId(item.chats_count);
                    let operatorKey = `${item.name_last} ${item.name_first}`;

                    if (!timers[operatorKey] || timers[operatorKey].statusId !== currentStatusId) {
                        timers[operatorKey] = {
                            startTime: Date.now(),
                            statusId: currentStatusId
                        };
                    }

                    let name = document.createElement('div');
                    let chats_count = document.createElement('div');
                    let status = document.createElement('div');
                    let timer = document.createElement('div');

                    name.style.fontWeight = 'bold';
                    status.style.fontWeight = 'bold';

                  let elems = [name, chats_count, status, timer];

                    elems.forEach((elem, i) => {
                        elem.style.border = '1px solid #e7e7e7';
                        elem.style.padding = '7px 10px';
                        elem.style.borderTop = 'none';
                        if (i === elems.length - 1) {
                            elem.style.minWidth = '120px';
                        }
                        if (i !== elems.length - 1) {
                            elem.style.borderRight = 'none';
                        }
                    });


                    name.textContent = `${item.name_last} ${item.name_first}`;
                    chats_count.textContent = item.chats_count;
                    status.textContent = getStatusText(currentStatusId);
                    timer.textContent = formatTime(timers[operatorKey].startTime);

                    updateBackground(elems, currentStatusId);

                    gridMonitoring.appendChild(name);
                    gridMonitoring.appendChild(chats_count);
                    gridMonitoring.appendChild(status);
                    gridMonitoring.appendChild(timer);
                });

                localStorage.setItem('timers', JSON.stringify(timers));
            })
            .catch(function (error) {
                console.log(error);
            });
    };

    resetTimers();
    fetchAndDisplayData();
    setInterval(fetchAndDisplayData, 15000);


         }
    }, 3000);
});

})();