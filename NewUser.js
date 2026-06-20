// ==UserScript==
// @name         Создание учетки
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Создание учетки
// @author       @Sselenso
// @match        https://ai.sknt.ru/*
// @match        https://skygrade.ru/*
// @match        https://skygrade.ru/wp-admin/user-new.php
// @grant        none
// @updateURL    https://raw.githubusercontent.com/Sselenso/Scripts/main/NewUser.js
// @downloadURL  https://raw.githubusercontent.com/Sselenso/Scripts/main/NewUser.js
// ==/UserScript==

(function() {
    'use strict';

    // Функция для проверки наличия маркеров на странице
    function isTargetPage() {
        const bodyText = document.body?.innerText || '';
        const markers = [
            /\[HR\]\s*\[Сервис\]/,
            /стажировка/,
            /график/,
            /Добавить на доску/
        ];
        return markers.every(marker => marker.test(bodyText));
    }

    // Функция для поиска элементов с данными
    function findDataElements() {
        // Ищем ФИО - может быть в разных местах
        const fioSelectors = [
            '.dfbc1f3 span',
            '.fio-class', // добавьте другие селекторы если знаете
            '[class*="fio"]',
            '[class*="name"]'
        ];

        let fioElement = null;
        for (const selector of fioSelectors) {
            const el = document.querySelector(selector);
            if (el && /[А-Яа-яЁё]+\s+[А-Яа-яЁё]+\s+[А-Яа-яЁё]+/.test(el.textContent)) {
                fioElement = el;
                break;
            }
        }

        // Ищем email
        const emailSelectors = [
            '.sb4cf00 p a',
            '[class*="email"] a',
            'a[href^="mailto:"]'
        ];

        let emailElement = null;
        for (const selector of emailSelectors) {
            const el = document.querySelector(selector);
            if (el && /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(el.textContent)) {
                emailElement = el;
                break;
            }
        }

        return { fioElement, emailElement };
    }

    // Создание кнопки
    function createButton() {
        // Удаляем старую кнопку если есть
        const oldButton = document.getElementById('custom-data-button');
        if (oldButton) oldButton.remove();

        const button = document.createElement('button');
        button.id = 'custom-data-button';
        button.innerHTML = 'Создать учетку';
        button.style.position = 'fixed';
        button.style.top = '65px';
        button.style.right = '165px';
        button.style.zIndex = 1000;
        button.style.padding = '8px 12px';
        button.style.backgroundColor = '#5cb85c';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '5px';
        button.style.cursor = 'pointer';
        button.style.transition = 'background-color 0.3s';

        button.onmouseover = () => button.style.backgroundColor = '#5cb85c';
        button.onmouseout = () => button.style.backgroundColor = '#4cae4c';

        document.body.appendChild(button);
        return button;
    }

    // Остальные функции без изменений...
    function transliterate(text) {
        const translitMap = {
            'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo', 'Ж': 'Zh',
            'З': 'Z', 'И': 'I', 'Й': 'J', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O',
            'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'H', 'Ц': 'C',
            'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch', 'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu',
            'Я': 'Ya', 'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
            'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'j', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
            'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h',
            'ц': 'c', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e',
            'ю': 'yu', 'я': 'ya'
        };
        return text.split('').map(char => translitMap[char] || char).join('');
    }

    function generateShortName(fullName) {
        const parts = fullName.split(' ');
        if (parts.length >= 2) {
            const lastName = transliterate(parts[0]).toLowerCase();
            const firstNameInitial = transliterate(parts[1][0]).toLowerCase();
            return `${lastName}.${firstNameInitial}`;
        } else {
            return transliterate(parts[0]).toLowerCase();
        }
    }

    function generatePassword(length = 12) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    function extractData() {
        const { fioElement, emailElement } = findDataElements();

        if (!fioElement || !emailElement) {
            alert('Не удалось найти данные на странице. Попробуйте обновить страницу.');
            return null;
        }

        const fioMatch = fioElement.textContent.match(/([А-Яа-яЁё]+ [А-Яа-яЁё]+ [А-Яа-яЁё]+)/);
        if (!fioMatch) {
            alert('Не удалось извлечь ФИО.');
            return null;
        }

        const fio = fioMatch[0].trim();
        const email = emailElement.textContent.trim();

        const shortName = generateShortName(fio);
        const password = generatePassword();

        return `${fio}\t${email}\t${shortName}\t${password}`;
    }

    function createModal(data) {
        const modal = document.createElement('div');
        modal.id = 'custom-modal';
        modal.style.display = 'none';
        modal.style.position = 'fixed';
        modal.style.zIndex = 1000;
        modal.style.left = 0;
        modal.style.top = 0;
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.overflow = 'auto';
        modal.style.backgroundColor = 'rgba(0,0,0,0.4)';

        const modalContent = document.createElement('div');
        modalContent.style.backgroundColor = '#fefefe';
        modalContent.style.margin = '15% auto';
        modalContent.style.padding = '20px';
        modalContent.style.border = '1px solid #888';
        modalContent.style.width = '50%';
        modalContent.style.borderRadius = '10px';
        modalContent.style.boxShadow = '0px 4px 8px rgba(0, 0, 0, 0.2)';

        const closeButton = document.createElement('span');
        closeButton.innerHTML = '&times;';
        closeButton.style.color = '#aaa';
        closeButton.style.float = 'right';
        closeButton.style.fontSize = '28px';
        closeButton.style.fontWeight = 'bold';
        closeButton.style.cursor = 'pointer';
        closeButton.onclick = () => modal.style.display = 'none';

        const textarea = document.createElement('textarea');
        textarea.style.width = '100%';
        textarea.style.height = '100px';
        textarea.style.marginBottom = '10px';
        textarea.value = data;

        const copyButton = document.createElement('button');
        copyButton.innerHTML = 'Скопировать и перейти';
        copyButton.style.backgroundColor = '#5cb85c';
        copyButton.style.color = 'white';
        copyButton.style.border = 'none';
        copyButton.style.padding = '10px 20px';
        copyButton.style.cursor = 'pointer';
        copyButton.style.borderRadius = '5px';
        copyButton.style.transition = 'background-color 0.3s';
        copyButton.onmouseover = () => copyButton.style.backgroundColor = '#5cb85c';
        copyButton.onmouseout = () => copyButton.style.backgroundColor = '#4cae4c';
        copyButton.onclick = () => {
            navigator.clipboard.writeText(data).then(() => {
                window.open('https://skygrade.ru/wp-admin/user-new.php', '_blank');
            }).catch(err => {
                console.error('Ошибка при копировании данных: ', err);
            });
        };

        modalContent.appendChild(closeButton);
        modalContent.appendChild(textarea);
        modalContent.appendChild(copyButton);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        return modal;
    }

    // Основная функция для ai.sknt.ru
    function initAiPage() {
        let button = null;
        let modal = null;
        let isActive = false;

        function checkAndRender() {
            const target = isTargetPage();

            if (target && !isActive) {
                // Показываем кнопку
                if (!button) {
                    button = createButton();
                    button.onclick = () => {
                        const data = extractData();
                        if (data) {
                            if (!modal) modal = createModal(data);
                            modal.style.display = 'block';
                        }
                    };
                }
                button.style.display = 'block';
                isActive = true;
            } else if (!target && isActive) {
                // Скрываем кнопку
                if (button) button.style.display = 'none';
                if (modal) modal.style.display = 'none';
                isActive = false;
            }
        }

        // Первоначальная проверка
        setTimeout(checkAndRender, 1000);

        // Наблюдатель за изменениями в DOM
        const observer = new MutationObserver(() => {
            checkAndRender();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });

        // Также отслеживаем изменения URL (для SPA)
        let lastUrl = location.href;
        new MutationObserver(() => {
            const url = location.href;
            if (url !== lastUrl) {
                lastUrl = url;
                setTimeout(checkAndRender, 500);
            }
        }).observe(document, { subtree: true, childList: true });

        return observer;
    }

    // Запуск для ai.sknt.ru
    if (window.location.href.includes('ai.sknt.ru')) {
        let observer = initAiPage();

        // Пересоздаем наблюдатель при перезагрузке SPA
        window.addEventListener('beforeunload', () => {
            if (observer) observer.disconnect();
        });
    }

    // Остальной код для skygrade.ru без изменений...
    else if (window.location.href.includes('skygrade.ru')) {
        const buttonStyles = `
            padding: 5px 20px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
            transition: background-color 0.3s;
        `;

        function createButton() {
            const button = document.createElement('button');
            button.innerHTML = 'Перейти';
            button.style.cssText = buttonStyles;

            button.onclick = () => {
                window.location.href = 'https://skygrade.skynet.ru/user/editadvanced.php?id=-1';
            };

            button.onmouseover = () => button.style.backgroundColor = '#0056b3';
            button.onmouseout = () => button.style.backgroundColor = '#007bff';

            return button;
        }

        function addButtonToMenu() {
            const menu = document.querySelector('#wp-admin-bar-new-content-default');
            if (menu) {
                const listItem = document.createElement('li');
                listItem.setAttribute('role', 'group');
                listItem.setAttribute('id', 'wp-admin-bar-new-custom-user');
                listItem.appendChild(createButton());
                menu.appendChild(listItem);
            }
        }

        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(addButtonToMenu, 2000);
        });

        const additionalButtonStyles = `
            padding: 2px 20px;
            background-color: #D36135;
            font-size: 14px;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
            transition: background-color 0.3s;
            position: fixed;
            top: 2px;
            right: 400px;
            z-index: 9999999;
        `;

        function createAdditionalButton() {
            const button = document.createElement('button');
            button.innerHTML = 'Перейти';
            button.style.cssText = additionalButtonStyles;

            button.onclick = () => {
                window.location.href = 'https://skygrade.ru/wp-admin/user-new.php';
            };

            button.onmouseover = () => button.style.backgroundColor = '#ff6900';
            button.onmouseout = () => button.style.backgroundColor = '#D36135';

            document.body.appendChild(button);
        }

        createAdditionalButton();

        if (window.location.href.includes('wp-admin/user-new.php')) {
            function createUserButton() {
                const button = document.createElement('button');
                button.innerHTML = 'Создать';
                button.style.position = 'fixed';
                button.style.top = '32px';
                button.style.right = '130px';
                button.style.zIndex = 99999999;
                button.style.padding = '7.5px 20px';
                button.style.backgroundColor = '#68de7c';
                button.style.color = '#fff';
                button.style.border = '1px solid #c3c4c7';
                button.style.borderTop = 'none';
                button.style.borderRadius = '0 0 4px 4px';
                button.style.cursor = 'pointer';
                button.style.boxShadow = '0 0 0 transparent';
                button.style.transition = 'box-shadow .1slinear';

                button.onmouseover = () => button.style.backgroundColor = '#27ae60';
                button.onmouseout = () => button.style.backgroundColor = '#68de7c';

                document.body.appendChild(button);
                return button;
            }

            function createUserModal() {
                const modal = document.createElement('div');
                modal.style.display = 'none';
                modal.style.position = 'fixed';
                modal.style.zIndex = 1000;
                modal.style.left = 0;
                modal.style.top = 0;
                modal.style.width = '100%';
                modal.style.height = '100%';
                modal.style.overflow = 'auto';
                modal.style.backgroundColor = 'rgba(0,0,0,0.4)';

                const modalContent = document.createElement('div');
                modalContent.style.backgroundColor = '#fefefe';
                modalContent.style.margin = '10% auto';
                modalContent.style.padding = '20px';
                modalContent.style.border = '1px solid #888';
                modalContent.style.width = '50%';
                modalContent.style.borderRadius = '10px';
                modalContent.style.boxShadow = '0px 4px 8px rgba(0, 0, 0, 0.2)';

                const closeButton = document.createElement('span');
                closeButton.innerHTML = '&times;';
                closeButton.style.color = '#aaa';
                closeButton.style.float = 'right';
                closeButton.style.fontSize = '28px';
                closeButton.style.fontWeight = 'bold';
                closeButton.style.cursor = 'pointer';

                closeButton.onclick = () => modal.style.display = 'none';

                const departmentSelect = document.createElement('select');
                departmentSelect.style.width = '100%';
                departmentSelect.style.marginBottom = '10px';

                const departments = [
                    { value: 'Сервис', text: 'Сервис' },
                    { value: 'Сервис Внешний', text: 'Сервис Внешний' }
                ];

                departments.forEach(department => {
                    const option = document.createElement('option');
                    option.value = department.value;
                    option.textContent = department.text;
                    departmentSelect.appendChild(option);
                });

                const input = document.createElement('textarea');
                input.style.width = '100%';
                input.style.height = '150px';
                input.style.marginBottom = '10px';
                input.placeholder = 'Введите данные в формате:\nФИО\tEmail\tЛогин\tПароль';

                const submitButton = document.createElement('button');
                submitButton.innerHTML = 'Вставить данные';
                submitButton.style.backgroundColor = '#007bff';
                submitButton.style.color = 'white';
                submitButton.style.border = 'none';
                submitButton.style.padding = '10px 20px';
                submitButton.style.cursor = 'pointer';
                submitButton.style.borderRadius = '5px';
                submitButton.style.transition = 'background-color 0.3s';

                submitButton.onmouseover = () => submitButton.style.backgroundColor = '#0056b3';
                submitButton.onmouseout = () => submitButton.style.backgroundColor = '#007bff';

                submitButton.onclick = () => {
                    const data = input.value.trim().split('\t');
                    if (data.length === 4) {
                        fillUserForm(data, departmentSelect.value);
                        modal.style.display = 'none';
                    } else {
                        alert('Неверный формат данных. Пожалуйста, введите данные в формате:\nФИО\tEmail\tЛогин\tПароль');
                    }
                };

                modalContent.appendChild(closeButton);
                modalContent.appendChild(departmentSelect);
                modalContent.appendChild(input);
                modalContent.appendChild(submitButton);
                modal.appendChild(modalContent);
                document.body.appendChild(modal);
                return modal;
            }

            function fillUserForm(data, departmentValue) {
                const [fullName, email, username, password] = data;
                const [lastname, firstname, patronymic = ''] = fullName.split(' ');

                const usernameField = document.getElementById('user_login');
                const lastnameField = document.getElementById('last_name');
                const firstnameField = document.getElementById('first_name');
                const emailField = document.getElementById('email');
                const passwordField = document.getElementById('pass1');
                const departmentField = document.getElementById('lp-department');

                const subscriberCheckbox = document.querySelector('input[value="subscriber"]');
                const serviceStudentCheckbox = document.querySelector('input[value="service_student"]');
                const extServiceStudentCheckbox = document.querySelector('input[value="ext_service_student"]');

                if (!usernameField || !lastnameField || !firstnameField || !emailField || !passwordField || !departmentField || !subscriberCheckbox) {
                    alert('Некоторые поля не найдены на странице. Проверьте скрипт.');
                    return;
                }

                usernameField.value = username;
                lastnameField.value = lastname;
                firstnameField.value = firstname;
                emailField.value = email;
                passwordField.value = password;
                departmentField.value = departmentValue;

                subscriberCheckbox.checked = false;
                serviceStudentCheckbox.checked = false;
                extServiceStudentCheckbox.checked = false;

                if (departmentValue === 'Сервис Внешний') {
                    extServiceStudentCheckbox.checked = true;
                } else if (departmentValue === 'Сервис') {
                    serviceStudentCheckbox.checked = true;
                }
            }

            function mainUserCreator() {
                const button = createUserButton();
                const modal = createUserModal();

                button.onclick = () => modal.style.display = 'block';
            }

            mainUserCreator();
        }
    }
})();