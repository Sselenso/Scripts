// ==UserScript==
// @name Monitoring__bot
// @namespace http://tampermonkey.net/
// @version 0.6
// @description Monitoring__bot
// @match https://ai.sknt.ru/monitoring_cc
// @require https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js
// @grant GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    // Функция для проверки времени и сбора данных специалистов
    function checkCellTime() {
        const rows = document.querySelectorAll("._tableRow_26gbz_1");
        const specialistsData = [];
        let totalSpecialists = 0;
        let talkingSpecialists = 0;

        rows.forEach((row, rowIndex) => {
            const cells = row.querySelectorAll("._tableCell_1a192_1");
            if (cells.length === 0) {
               /* console.log(`В строке ${rowIndex + 1} не найдены ячейки.`);*/
                return; // Пропускаем, если ячеек нет
            }

            const nameCell = cells[0];
            const statusCell = cells[2];
            const timeCell = cells[3];

            if (nameCell && statusCell && timeCell) {
                const name = nameCell.querySelector(".font-bold")?.textContent.trim() || "Не удалось извлечь имя";
                const status = statusCell.textContent.trim();
                const timeText = timeCell.textContent.trim();

                // Регулярное выражение для извлечения часов, минут и секунд
                const timeRegex = /(\d+)\s*(час|часа|час|мин|минуты|мин|сек|секунды|секунда)/g;
                let totalSeconds = 0;

                let match;
                while ((match = timeRegex.exec(timeText)) !== null) {
                    const timeValue = parseInt(match[1]);
                    const timeUnit = match[2];

                    // Конвертируем в секунды
                    if (timeUnit.includes("час")) {
                        totalSeconds += timeValue * 3600; // Часы в секунды
                    } else if (timeUnit.includes("мин")) {
                        totalSeconds += timeValue * 60; // Минуты в секунды
                    } else if (timeUnit.includes("сек")) {
                        totalSeconds += timeValue; // Секунды
                    }
                }

                // Проверяем наличие ФИО, статуса и времени
                if (name && status && totalSeconds > 0) {
                    totalSpecialists++; // Увеличиваем общее количество специалистов

                    // Учитываем специалистов в статусе "Разговаривает"
                    if (status === "Разговаривает" || status === "Свободен") {
                        talkingSpecialists++;
                        // Проверяем время для "Разговаривает"
                        if (totalSeconds > 1200) {
                            specialistsData.push({ name, status, time: timeText });
                           /* console.log(`Добавлено: Имя - ${name}, Статус - ${status}, Время - ${timeText}`);*/
                        }
                    } else if (status === "Недоступен" && totalSeconds > 30) {
                        specialistsData.push({ name, status, time: timeText });
                        /*console.log(`Добавлено: Имя - ${name}, Статус - ${status}, Время - ${timeText}`);*/
                    } else if (status === "Выключен" && totalSeconds > 60) {
                        specialistsData.push({ name, status, time: timeText });
                       /* console.log(`Добавлено: Имя - ${name}, Статус - ${status}, Время - ${timeText}`);*/
                    }

                }
            } 
        });

        return { specialistsData, totalSpecialists, talkingSpecialists };
    }

    // Функция для сбора данных из таблицы очереди
    function collectQueueTableData() {
        const table = document.querySelector('table');
        if (!table) {
            console.error('Queue Table not found');
            return [];
        }

        const rows = table.querySelectorAll('tr');
        const data = [];

        rows.forEach(row => {
            const cells = row.querySelectorAll('td, th');
            const rowData = Array.from(cells).map(cell => cell.textContent.trim());
            if (rowData.length > 0) {
                data.push(rowData);
            }
        });

        return data;
    }

    // Функция для отправки данных на сервер
  function sendData(queueData, specialistsData, totalSpecialists, talkingSpecialists) {
    const data = {
        queue: queueData,
        specialists: specialistsData,
        totalSpecialists,
        talkingSpecialists
    };

   /* console.log('JSON to send:', JSON.stringify(data, null, 2));*/

    axios.post('https://100.64.3.144:5000/data', data, {
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    })
   /* .then(response => {
        console.log('Server response:', response.data);
    })*/
    .catch(error => {
        console.error('Error sending data:', error);
    });
}

    // Функция для обработки данных таблиц и отправки на сервер
    function processTablesData() {
        const queueData = collectQueueTableData(); // Данные из таблицы очереди
        const { specialistsData, totalSpecialists, talkingSpecialists } = checkCellTime(); // Данные по специалистам

        if (queueData.length > 0 || specialistsData.length > 0) {
            sendData(queueData, specialistsData, totalSpecialists, talkingSpecialists);
        } else {
            console.error('No data to send');
        }
    }

    // Функция для ожидания загрузки таблиц и запуска наблюдателя
    function waitForTablesAndObserve(retries = 10, interval = 1000) {
        const table = document.querySelector('table'); // Основная таблица
        if (table) {
            // Запускаем MutationObserver для отслеживания изменений
            const observer = new MutationObserver(() => {                
                processTablesData();
            });

            const config = { childList: true, subtree: true };
            observer.observe(table, config);
            console.log('MutationObserver запущен');
        } else if (retries > 0) {
            // Повторяем попытку через интервал
            setTimeout(() => {
                waitForTablesAndObserve(retries - 1, interval);
            }, interval);
        } else {
            console.error('Table not found after several retries');
        }
    }

    // Старт скрипта
    waitForTablesAndObserve();
})();
