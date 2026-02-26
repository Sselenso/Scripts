// ==UserScript==
// @name         Звонки новые
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Кнопка "Звонки" с выбором номеров через попап
// @author       Sselenso
// @match        https://ai.sknt.ru/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @updateURL    https://raw.githubusercontent.com/Sselenso/Scripts/main/Call.user.js
// @downloadURL  https://raw.githubusercontent.com/Sselenso/Scripts/main/Call.user.js
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // === Извлечение номеров из страницы ===
  function extractPhoneNumbers() {
    const phonePattern = /(?:\+?7|8)[\s\-()]*(?:\d[\s\-()]*){10}/g;
    const found = new Set();

    document.querySelectorAll('span').forEach(span => {
      const text = span.textContent;
      let match;
      while ((match = phonePattern.exec(text)) !== null) {
        const digits = match[0].replace(/\D/g, '');
        let clean = digits;
        if (digits.startsWith('8')) clean = digits.substring(1);
        else if (digits.startsWith('7') && digits.length === 11) clean = digits.substring(1);

        if (clean.length === 10) {
          found.add(clean);
        }
      }
    });

    return Array.from(found);
  }

  // === Форматирование номера для отображения ===
  function formatPhone(phone) {
    return `8 (${phone.slice(0,3)}) ${phone.slice(3,6)}-${phone.slice(6,8)}-${phone.slice(8,10)}`;
  }

  // === Создание попапа выбора номеров ===
  function showPhoneSelectionPopup(phones) {
    // Фон
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0; left: 0;
      width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.5);
      z-index: 100000;
      display: flex;
      justify-content: center;
      align-items: center;
    `;

    // Окно
    const popup = document.createElement('div');
    popup.style.cssText = `
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.25);
      padding: 20px;
      max-width: 420px;
      width: 90vw;
      max-height: 80vh;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
    `;
    overlay.appendChild(popup);

    // Заголовок
    const title = document.createElement('h3');
    title.textContent = `Выберите номера (${phones.length})`;
    title.style.margin = '0 0 16px 0';
    popup.appendChild(title);

    // Список номеров
    const listContainer = document.createElement('div');
    listContainer.style.maxHeight = '400px';
    listContainer.style.overflowY = 'auto';
    listContainer.style.marginBottom = '16px';

    const checkboxes = [];
    phones.forEach(phone => {
      const label = document.createElement('label');
      label.style.display = 'flex';
      label.style.alignItems = 'center';
      label.style.padding = '6px 0';
      label.style.cursor = 'pointer';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = phone;
      checkbox.checked = true;
      checkboxes.push(checkbox);

      const span = document.createElement('span');
      span.textContent = formatPhone(phone);
      span.style.marginLeft = '8px';

      label.appendChild(checkbox);
      label.appendChild(span);
      listContainer.appendChild(label);
    });

    popup.appendChild(listContainer);

    // Кнопки управления
    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.justifyContent = 'space-between';

    // Кнопка "Загрузить все"
    const loadAllBtn = document.createElement('button');
    loadAllBtn.textContent = 'Загрузить все';
    loadAllBtn.style.padding = '8px 16px';
    loadAllBtn.style.backgroundColor = '#58676e';
    loadAllBtn.style.color = '#fff';
    loadAllBtn.style.border = '1px solid #8aa0ad';
    loadAllBtn.style.borderRadius = '4px';
    loadAllBtn.style.cursor = 'pointer';
    loadAllBtn.style.fontWeight = '500';

    // Кнопка "Отмена"
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Отмена';
    cancelBtn.style.padding = '8px 16px';
    cancelBtn.style.backgroundColor = '#f0f0f0';
    cancelBtn.style.border = '1px solid #ccc';
    cancelBtn.style.borderRadius = '4px';
    cancelBtn.style.cursor = 'pointer';

    actions.appendChild(cancelBtn);
    actions.appendChild(loadAllBtn);
    popup.appendChild(actions);

    // Закрытие
    const close = () => {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    };

    cancelBtn.onclick = close;
    overlay.onclick = (e) => {
      if (e.target === overlay) close();
    };

    // Обработка "Загрузить все"
    loadAllBtn.onclick = () => {
      const selectedPhones = checkboxes
        .filter(cb => cb.checked)
        .map(cb => cb.value);

      if (selectedPhones.length === 0) {
        alert('Выберите хотя бы один номер.');
        return;
      }

      selectedPhones.forEach(phone => {
        const url = `https://ai.sknt.ru/?cat=calls_records&_f[phone]=${encodeURIComponent(phone)}&_f[date_from]=01.09.2025`;
        window.open(url, '_blank');
      });

      close();
    };

    document.body.appendChild(overlay);
  }

  // === Добавление кнопки "Звонки" ===
  function addCallButton() {
    const container = document.querySelector('.bc46936');
    if (!container || container.querySelector('.tm-call-button-v3')) return;

    const button = document.createElement('div');
    button.className = 'tm-call-button-v3';
    button.textContent = 'Звонки';
    Object.assign(button.style, {
     display: 'inline-flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '14px 12px',
      height: '24px',
      backgroundColor: '#58676e',
      color: '#fff',
      fontSize: '14px',
      borderRadius: '4px',
      cursor: 'pointer',
      border: '1px solid #8aa0ad',
      boxSizing: 'border-box',
      transition: 'background-color 0.2s'
    });

    button.addEventListener('mouseover', () => {
      button.style.backgroundColor = '#465555';
    });
    button.addEventListener('mouseout', () => {
      button.style.backgroundColor = '#58676e';
    });

    button.addEventListener('click', () => {
      const rawPhones = extractPhoneNumbers();
      if (rawPhones.length === 0) {
        alert('Не найдено подходящих номеров телефонов.');
        return;
      }
      showPhoneSelectionPopup(rawPhones);
    });

    container.appendChild(button);
    console.log('✅ Кнопка "Звонки" добавлена');
  }

  // === Умное ожидание появления контейнера ===
  function waitForElement(selector, callback, timeoutMs = 10000) {
    if (document.querySelector(selector)) {
      callback();
      return;
    }

    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        callback();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), timeoutMs);
  }

  // === Запуск ===
  waitForElement('.bc46936', addCallButton);
})();