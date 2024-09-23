// ==UserScript==
// @name Звонки
// @namespace http://tampermonkey.net/
// @version 1.2
// @description Звонки с улучшением стилей
// @author Sselenso
// @match https://ai.sknt.ru/*
// @icon data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @updateURL    https://raw.githubusercontent.com/Sselenso/Scripts/main/Call.user.js
// @downloadURL  https://raw.githubusercontent.com/Sselenso/Scripts/main/Call.user.js
// @grant none
// ==/UserScript==

(function() {
  'use strict';

  function addElement() {
    const container = document.querySelector('.bc46936');
    if (container) {
      const newElement = document.createElement('div');
      newElement.className = 'b1d07c1';

      const testElement = document.createElement('div');
      testElement.className = 'test';
      testElement.textContent = "Звонки";
      testElement.style.display = 'inline-flex';
      testElement.style.justifyContent = 'center';
      testElement.style.alignItems = 'center';
      testElement.style.padding = "0px 8px";
      testElement.style.backgroundColor = "#58676e";
      testElement.style.color = "#fff";
      testElement.style.fontSize = "14px";
      testElement.style.borderColor = '#8aa0ad';
      testElement.style.borderRadius = "5px";
      testElement.style.cursor = "pointer";
      testElement.style.transition = 'background-color 0.3s ease';

      // Изменение цвета при наведении
      testElement.addEventListener('mouseover', function() {
        testElement.style.backgroundColor = "#465555";
      });

      testElement.addEventListener('mouseout', function() {
        testElement.style.backgroundColor = "#58676e";
      });

      newElement.appendChild(testElement);
      container.appendChild(newElement);

      testElement.addEventListener('click', function() {
        const phoneNumberElements = document.querySelectorAll('.p0d3655');
        if (phoneNumberElements.length > 0) {
          phoneNumberElements.forEach(function(element) {
            const phoneNumber = element.textContent;
            let encodedPhoneNumber = encodeURIComponent(phoneNumber);
            if (phoneNumber.startsWith("8")) {
              encodedPhoneNumber = encodeURIComponent(phoneNumber.slice(1));
            }
            const url = "https://ai.sknt.ru/?cat=calls_records&_f[phone]=" + encodedPhoneNumber + "&_f[date_from]=01.09.2023";
            window.open(url, "_blank");
          });
        }
      });
    }
    return !!container;
  }

  setTimeout(function() {
    addElement();
  }, 3000);

})();
