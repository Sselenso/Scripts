// ==UserScript==
// @name         Мониторинг алерт и окрашивание чатов
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Мониторинг алертов и чатов
// @author       Sselenso
// @match        https://ai.sknt.ru/monitoring_cc
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// @updateURL    https://raw.githubusercontent.com/Sselenso/Scripts/main/Monitoring_alert.js
// @downloadURL  https://raw.githubusercontent.com/Sselenso/Scripts/main/Monitoring_alert.js
// ==/UserScript==

(function () {
	"use strict";

	const notificationHistory = {};
	let telegramEnabled = false;
	let conversationTime = 900;
	let unavailableEnabled = false;
	let unavailableTime = 30;
	let disabledEnabled = false;
	let disabledTime = 1200;
	let soundEnabled = true; // Новый параметр для включения/отключения звукового уведомления
	let soundPlayed = false; // Флаг для отслеживания воспроизведения звука

	function createModal() {
		const modalContainer = document.createElement("div");
		modalContainer.id = "custom-modal";
		modalContainer.style.display = "none";
		modalContainer.style.position = "fixed";
		modalContainer.style.top = "0";
		modalContainer.style.left = "0";
		modalContainer.style.width = "100%";
		modalContainer.style.height = "100%";
		modalContainer.style.background = "rgba(0, 0, 0, 0.5)";
		modalContainer.style.zIndex = "9999";

		const modalContent = document.createElement("div");
		modalContent.style.position = "absolute";
		modalContent.style.top = "50%";
		modalContent.style.left = "50%";
		modalContent.style.transform = "translate(-50%, -50%)";
		modalContent.style.background = "white";
		modalContent.style.padding = "20px";
		modalContent.style.borderRadius = "5px";
		modalContent.style.display = "flex";
		modalContent.style.flexDirection = "column";
		modalContent.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";

		const modalText = document.createElement("div");
		modalText.id = "custom-modal-text";
		modalText.style.textAlign = "center";

		const modalButton = document.createElement("button");
		modalButton.textContent = "Ок";
		modalButton.style.margin = "20px auto";
		modalButton.style.padding = "10px 30px";
		modalButton.style.backgroundColor = "#116466";
		modalButton.style.color = "#FFFFFF";
		modalButton.style.textAlign = "center";
		modalButton.style.fontSize = "20px";
		modalButton.style.borderRadius = "5px";
		modalButton.style.border = "none";
		modalButton.style.cursor = "pointer";
		modalButton.style.transition = "background-color 0.3s ease";
		modalButton.addEventListener("click", hideModal);
		modalButton.addEventListener("mouseover", () => modalButton.style.backgroundColor = "#115153");
		modalButton.addEventListener("mouseout", () => modalButton.style.backgroundColor = "#116466");

		modalContent.appendChild(modalText);
		modalContainer.appendChild(modalContent);
		modalContent.appendChild(modalButton);
		document.body.appendChild(modalContainer);
	}

	function createSettingsWindow() {
		const settingsButton = document.createElement("button");
		settingsButton.textContent = "Настройки";
		settingsButton.style.position = "fixed";
		settingsButton.style.top = "10px";
		settingsButton.style.right = "500px";
		settingsButton.style.zIndex = "9997";
		settingsButton.style.padding = "8px 20px";
		settingsButton.style.fontSize = "14px";
		settingsButton.style.borderRadius = "5px";
		settingsButton.style.backgroundColor = "transparent";
		settingsButton.style.color = "#808080";
		settingsButton.style.border = "1px solid #ccc";
		settingsButton.style.cursor = "pointer";
		settingsButton.style.transition = "background-color 0.3s ease";
		settingsButton.addEventListener("click", () => {
			showSettings();
		});
		const defaultBackgroundColor = "transparent";

		settingsButton.addEventListener("mouseover", () => {
			settingsButton.style.backgroundColor = "#e7e7e7";
			settingsButton.style.color = "#333333";
		});

		settingsButton.addEventListener("mouseout", () => {
			settingsButton.style.backgroundColor = defaultBackgroundColor;
			settingsButton.style.color = "#808080";
		});

		document.body.appendChild(settingsButton);

		const settingsWindow = document.createElement("div");
		settingsWindow.id = "settingsWindow";
		settingsWindow.style.display = "none";
		settingsWindow.style.position = "fixed";
		settingsWindow.style.top = "50%";
		settingsWindow.style.left = "50%";
		settingsWindow.style.transform = "translate(-50%, -50%)";
		settingsWindow.style.width = "500px";
		settingsWindow.style.height = "auto";
		settingsWindow.style.backgroundColor = "#F2F2F7";
		settingsWindow.style.borderRadius = "5px";
		settingsWindow.style.padding = "20px";
		settingsWindow.style.zIndex = "9999";
		settingsWindow.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
		document.body.appendChild(settingsWindow);

		const closeButton = document.createElement("span");
		closeButton.textContent = "X";
		closeButton.style.position = "absolute";
		closeButton.style.top = "10px";
		closeButton.style.right = "10px";
		closeButton.style.fontSize = "20px";
		closeButton.style.color = "#000000";
		closeButton.style.cursor = "pointer";
		closeButton.addEventListener("click", () => {
			settingsWindow.style.display = "none";
		});
		settingsWindow.appendChild(closeButton);

		const settingsText = document.createElement("div");
		settingsText.textContent = "Настройки";
		settingsText.style.fontSize = "18px";
		settingsText.style.fontWeight = "700";
		settingsText.style.marginBottom = "10px";
		settingsWindow.appendChild(settingsText);

		const telegramCheckbox = createCheckbox("telegramCheckbox", "Отправлять уведомления в Telegram ", telegramEnabled);
		const conversationTimeInput = createNumberInput("conversationTimeInput", "Время разговора (секунды)", conversationTime);
		const unavailableCheckbox = createCheckbox("unavailableCheckbox", 'Проверять статус "Недоступен" ', unavailableEnabled);
		const unavailableTimeInput = createNumberInput("unavailableTimeInput", 'Время статуса "Недоступен" (секунды)', unavailableTime);
		const disabledCheckbox = createCheckbox("disabledCheckbox", 'Проверять статус "Выключен"  ', disabledEnabled);
		const disabledTimeInput = createNumberInput("disabledTimeInput", 'Время статуса "Выключен" (секунды)', disabledTime);
		const soundCheckbox = createCheckbox("soundCheckbox", 'Включить звуковое уведомление ', soundEnabled); // Новый чекбокс для звукового уведомления

		settingsWindow.appendChild(telegramCheckbox);
		settingsWindow.appendChild(conversationTimeInput);
		settingsWindow.appendChild(unavailableCheckbox);
		settingsWindow.appendChild(unavailableTimeInput);
		settingsWindow.appendChild(disabledCheckbox);
		settingsWindow.appendChild(disabledTimeInput);
		settingsWindow.appendChild(soundCheckbox); // Добавляем новый чекбокс в окно настроек

		const applyButton = document.createElement("button");
		applyButton.textContent = "Применить";
		applyButton.style.padding = "10px 20px";
		applyButton.style.backgroundColor = "#116466";
		applyButton.style.color = "#FFFFFF";
		applyButton.style.borderRadius = "5px";
		applyButton.style.border = "none";
		applyButton.style.cursor = "pointer";
		applyButton.style.transition = "background-color 0.3s ease";
		applyButton.addEventListener("click", applySettings);
		applyButton.addEventListener("mouseover", () => applyButton.style.backgroundColor = "#115153");
		applyButton.addEventListener("mouseout", () => applyButton.style.backgroundColor = "#116466");

		settingsWindow.appendChild(applyButton);
	}

	function createCheckbox(id, label, checked) {
		const checkboxContainer = document.createElement("div");
		checkboxContainer.style.display = "flex";
		checkboxContainer.style.alignItems = "center";
		checkboxContainer.style.marginBottom = "10px";

		const checkboxLabel = document.createElement("label");
		checkboxLabel.textContent = label;
		checkboxLabel.style.flex = "1";
		checkboxLabel.style.marginRight = "10px";

		const checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		checkbox.id = id;
		checkbox.checked = checked;
		checkbox.style.marginRight = "10px";

		checkboxContainer.appendChild(checkboxLabel);
		checkboxContainer.appendChild(checkbox);

		return checkboxContainer;
	}

	function createNumberInput(id, placeholder, value) {
		const inputContainer = document.createElement("div");
		inputContainer.style.display = "flex";
		inputContainer.style.alignItems = "center";
		inputContainer.style.marginBottom = "10px";
        inputContainer.style.padding ="5px";
        inputContainer.style.backgroundColor = "#ccc";
        inputContainer.style.borderRadius = "5px";

		const inputLabel = document.createElement("label");
		inputLabel.textContent = placeholder;
		inputLabel.style.flex = "1";
		inputLabel.style.marginRight = "10px";

		const numberInput = document.createElement("input");
		numberInput.type = "number";
		numberInput.id = id;
		numberInput.min = "0";
		numberInput.placeholder = placeholder;
		numberInput.style.width = "20%";
	/*	numberInput.style.marginRight = "10px";*/
		numberInput.style.padding = "5px";
		numberInput.style.borderRadius = "5px";
		numberInput.style.border = "1px solid #ccc";
		numberInput.value = value;

		inputContainer.appendChild(inputLabel);
		inputContainer.appendChild(numberInput);

		return inputContainer;
	}

	function showSettings() {
		const settingsWindow = document.getElementById("settingsWindow");
		settingsWindow.style.display = "block";
	}

	function applySettings() {
		const telegramEnabledCheckbox = document.getElementById("telegramCheckbox");
		const conversationTimeInput = document.getElementById("conversationTimeInput");
		const unavailableEnabledCheckbox = document.getElementById("unavailableCheckbox");
		const unavailableTimeInput = document.getElementById("unavailableTimeInput");
		const disabledEnabledCheckbox = document.getElementById("disabledCheckbox");
		const disabledTimeInput = document.getElementById("disabledTimeInput");
		const soundCheckbox = document.getElementById("soundCheckbox"); // Получаем значение нового чекбокса

		telegramEnabled = telegramEnabledCheckbox.checked;
		conversationTime = parseInt(conversationTimeInput.value);
		unavailableEnabled = unavailableEnabledCheckbox.checked;
		unavailableTime = parseInt(unavailableTimeInput.value);
		disabledEnabled = disabledEnabledCheckbox.checked;
		disabledTime = parseInt(disabledTimeInput.value);
		soundEnabled = soundCheckbox.checked; // Обновляем значение нового параметра

		localStorage.setItem("telegramEnabled", telegramEnabled);
		localStorage.setItem("conversationTime", conversationTime);
		localStorage.setItem("unavailableEnabled", unavailableEnabled);
		localStorage.setItem("unavailableTime", unavailableTime);
		localStorage.setItem("disabledEnabled", disabledEnabled);
		localStorage.setItem("disabledTime", disabledTime);
		localStorage.setItem("soundEnabled", soundEnabled); // Сохраняем значение нового параметра

		const settingsWindow = document.getElementById("settingsWindow");
		settingsWindow.style.display = "none";
	}

	function sendTelegramNotification(text) {
		const botToken = "6233062235:AAHqGmnsqpQedV6OzKSd23xJYIVjRYey_fc";
		const chatId = "-1001925587453";
		const customText = `${text}`;

		const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
		const data = {
			chat_id: chatId,
			text: customText,
		};

		fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(data),
		})
			.then((response) => response.json())
			.then((result) => {
				console.log("Telegram notification sent:", result);
			})
			.catch((error) => {
				console.error("Failed to send Telegram notification:", error);
			});
	}

	function setTitleNotification(text) {
		const originalTitle = document.title;
		const notificationText = `Кто-то проебывается`;
		let isTitleChanged = false;

		const intervalId = setInterval(() => {
			document.title = isTitleChanged ? originalTitle : notificationText;
			isTitleChanged = !isTitleChanged;
		}, 500);

		setTimeout(() => {
			clearInterval(intervalId);
			document.title = originalTitle;
		}, 5000);
	}

	function showModal(text) {
		const modalText = document.getElementById("custom-modal-text");

		const modalTextItem = document.createElement("div");
		modalTextItem.className = "custom-modal-text-item";
		modalTextItem.textContent = text;
		modalTextItem.style.padding = "5px";
		modalTextItem.style.fontSize = "20px";
		modalText.appendChild(modalTextItem);

		const modalContainer = document.getElementById("custom-modal");
		modalContainer.style.display = "flex";

		setTitleNotification(text);
		if (telegramEnabled) {
			sendTelegramNotification(text);
		}
		if (soundEnabled && !soundPlayed) { // Проверяем значение нового параметра
			playSound();
			soundPlayed = true; // Устанавливаем флаг в true после воспроизведения звука
		}
		setTimeout(hideModal, 10000);
	}

	function hideModal() {
		const modalText = document.getElementById("custom-modal-text");
		modalText.innerHTML = "";

		const modalContainer = document.getElementById("custom-modal");
		modalContainer.style.display = "none";
		soundPlayed = false; // Сбрасываем флаг при скрытии модального окна
	}

    function playSound() {
        const audio = new Audio("https://www.dropbox.com/scl/fi/exu5d8q0ms2bt7dyrrarg/mixkit-alert-bells-echo-765.wav?rlkey=4o1silnbmgnu14eey8iqyabxp&st=2sc2kq5j&raw=1");
        audio.play();
    }

	function checkCellTime() {
		const rows = document.querySelectorAll("._tableRow_26gbz_1");
		/*console.log("Rows selected:", rows);*/

		let stopChecking = false;

		rows.forEach((row) => {
			if (stopChecking) return;

			const cells = row.querySelectorAll("._tableCell_1a192_1");
			/*console.log("Cells in row:", cells);*/

			cells.forEach((cell) => {
				if (cell.textContent.trim() === "Кантри 1 линия") {
					stopChecking = true;
				}
			});

			if (stopChecking) return;

			const nameCell = cells[0];
			const statusCell = cells[2];
			const timeCell = cells[3];

			if (nameCell && statusCell && timeCell) {
				const name = nameCell.textContent.trim();
				const status = statusCell.textContent.trim().split(' ')[0];
				const timeText = timeCell.textContent.trim();
				const timeRegex = /(\d+)\s+(мин|час|часа|часов)\.?\s*(\d+)?\s*(сек|секунд)?/;
				const timeMatch = timeText.match(timeRegex);

				/*
                console.log("Name:", name);
				console.log("Status:", status);
				console.log("Time Text:", timeText);
				console.log("Time Match:", timeMatch);
                */

				if (timeMatch) {
					let totalSeconds = 0;
					if (timeMatch[2] === "мин" || timeMatch[2] === "мин.") {
						totalSeconds += parseInt(timeMatch[1]) * 60;
						if (timeMatch[3]) {
							totalSeconds += parseInt(timeMatch[3]);
						}
					} else if (timeMatch[2] === "час" || timeMatch[2] === "часа" || timeMatch[2] === "часов") {
						totalSeconds += parseInt(timeMatch[1]) * 3600;
						if (timeMatch[3]) {
							totalSeconds += parseInt(timeMatch[3]);
						}
					}

					if (status === "Разговаривает") {
						const conversationTimeSetting = conversationTime || 900; // По умолчанию 900 секунд (15 минут)
						if (totalSeconds > conversationTimeSetting) {
							const message = `${name} говорит ${timeText}`;

							if (!notificationHistory[name] || Date.now() - notificationHistory[name] > 300000) {
								showModal(message);
								notificationHistory[name] = Date.now();
							}
						}
					} else if (status === "Недоступен" && unavailableEnabled) {
						const unavailableTimeSetting = unavailableTime || 30; // По умолчанию 30 секунд
						if (totalSeconds > unavailableTimeSetting) {
							const message = `${name} недоступен ${timeText}`;

							if (!notificationHistory[name] || Date.now() - notificationHistory[name] > 60000) {
								showNotification(message);
								notificationHistory[name] = Date.now();
							}
						}
					} else if (status === "Выключен" && disabledEnabled) {
						const disabledTimeSetting = disabledTime || 1200; // По умолчанию 1200 секунд (20 минут)
						if (totalSeconds > disabledTimeSetting) {
							const message = `${name} выключен ${timeText}`;

							if (!notificationHistory[name] || Date.now() - notificationHistory[name] > 180000) {
								showNotification(message);
								notificationHistory[name] = Date.now();
							}
						}
					}
				}
			}
		});
	}

	function showNotification(message) {
		if (Notification.permission === "granted") {
			const notification = new Notification(message);
		} else if (Notification.permission !== "denied") {
			Notification.requestPermission().then((permission) => {
				if (permission === "granted") {
					const notification = new Notification(message);
				}
			});
		}
	}

	function init() {
		createModal();
		createSettingsWindow();

		const savedTelegramEnabled = localStorage.getItem("telegramEnabled");
		const savedConversationTime = localStorage.getItem("conversationTime");
		const savedUnavailableEnabled = localStorage.getItem("unavailableEnabled");
		const savedUnavailableTime = localStorage.getItem("unavailableTime");
		const savedDisabledEnabled = localStorage.getItem("disabledEnabled");
		const savedDisabledTime = localStorage.getItem("disabledTime");
		const savedSoundEnabled = localStorage.getItem("soundEnabled"); // Получаем сохраненное значение нового параметра

		if (savedTelegramEnabled !== null) {
			telegramEnabled = savedTelegramEnabled === "true";
		}
		if (savedConversationTime !== null) {
			conversationTime = parseInt(savedConversationTime);
		}
		if (savedUnavailableEnabled !== null) {
			unavailableEnabled = savedUnavailableEnabled === "true";
		}
		if (savedUnavailableTime !== null) {
			unavailableTime = parseInt(savedUnavailableTime);
		}
		if (savedDisabledEnabled !== null) {
			disabledEnabled = savedDisabledEnabled === "true";
		}
		if (savedDisabledTime !== null) {
			disabledTime = parseInt(savedDisabledTime);
		}
		if (savedSoundEnabled !== null) {
			soundEnabled = savedSoundEnabled === "true"; // Устанавливаем значение нового параметра
		}

		setInterval(checkCellTime, 15000);

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
	}

	init();
})();


