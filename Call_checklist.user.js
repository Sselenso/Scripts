// ==UserScript==
// @name         С чем звонок олд
// @namespace    http://tampermonkey.net/
// @version      0.9
// @description  с чем звонок олд?
// @author       You
// @match        https://ai.sknt.ru/?cat=ai_c&customer_id=*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Create the "С чем звонок?" button
    const callReasonButton = document.createElement("button");
    callReasonButton.textContent = "С чем звонок?";
    callReasonButton.style.position = "fixed";
    callReasonButton.style.top = "10px";
    callReasonButton.style.right = "500px";
    callReasonButton.style.zIndex = "9997";
    callReasonButton.style.padding = "8px 20px";
    callReasonButton.style.fontSize = "14px";
    callReasonButton.style.borderRadius = "5px";
    callReasonButton.style.backgroundColor = "transparent";
    callReasonButton.style.color = "#808080";
    callReasonButton.style.border = "1px solid #ccc";
    callReasonButton.style.cursor = "pointer";
    callReasonButton.style.transition = "background-color 0.3s ease";
    callReasonButton.addEventListener("click", () => {
        modal.style.display = "block";
    });

    const defaultBackgroundColor = "transparent";

    callReasonButton.addEventListener("mouseover", () => {
        callReasonButton.style.backgroundColor = "#e7e7e7";
        callReasonButton.style.color = "#333333";
    });

    callReasonButton.addEventListener("mouseout", () => {
        callReasonButton.style.backgroundColor = defaultBackgroundColor;
        callReasonButton.style.color = "#808080";
    });

    document.body.appendChild(callReasonButton);

    // Create the modal container
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '50%';
    modal.style.left = '50%';
    modal.style.transform = 'translate(-50%, -50%)';
    modal.style.backgroundColor = 'white';
    modal.style.padding = '20px';
    modal.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
    modal.style.zIndex = '9999';
    modal.style.borderRadius = '10px';
    modal.style.width = '600px';
    modal.style.textAlign = 'center';
    modal.classList.add('modal');
    modal.style.display = 'none'; // Initially hidden

    // Create the header for dragging
    const header = document.createElement('div');
    header.style.cursor = 'move';
    header.style.padding = '40px 10px 20px 10px';
    header.style.borderRadius = '10px 10px 0 0';
    header.textContent = 'Выбор вопроса';
    header.style.fontSize = "26px";
    header.style.fontWeight = "700";
    header.classList.add('modal-header');
    modal.appendChild(header);

    // Create the close button
    const closeButton = document.createElement("span");
    closeButton.textContent = "✕";
    closeButton.style.position = "absolute";
    closeButton.style.top = "10px";
    closeButton.style.right = "10px";
    closeButton.style.display = "flex";
    closeButton.style.justifyContent = "center";
    closeButton.style.alignItems = "center";
    closeButton.style.fontSize = "16px";
    closeButton.style.lineHeight = "1";
    closeButton.style.color = "#ffffff";
    closeButton.style.width = "24px";
    closeButton.style.height = "24px";
    closeButton.style.backgroundColor = "#FF3B30";
    closeButton.style.borderRadius = "50%";
    closeButton.style.cursor = "pointer";
    closeButton.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
    closeButton.style.transition = "background-color 0.3s ease, transform 0.2s ease";
    closeButton.style.transformOrigin = "center";

    closeButton.addEventListener("mouseover", () => {
        closeButton.style.backgroundColor = "#D32F2F";
        closeButton.style.transform = "scale(1.1)";
    });

    closeButton.addEventListener("mouseout", () => {
        closeButton.style.backgroundColor = "#FF3B30";
        closeButton.style.transform = "scale(1)";
    });

    closeButton.addEventListener("mousedown", () => {
        closeButton.style.backgroundColor = "#B71C1C";
        closeButton.style.transform = "scale(0.95)";
    });

    closeButton.addEventListener("mouseup", () => {
        closeButton.style.backgroundColor = "#D32F2F";
        closeButton.style.transform = "scale(1.1)";
    });

    closeButton.addEventListener("click", () => {
        modal.style.display = "none";
    });

    header.appendChild(closeButton);

    // Create the buttons
    const finButton = document.createElement('button');
    finButton.textContent = 'Фин';
    finButton.style.margin = '10px';
    finButton.classList.add('modal-button');

    const techButton = document.createElement('button');
    techButton.textContent = 'Тех';
    techButton.style.margin = '10px';
    techButton.classList.add('modal-button');

    // Append buttons to the modal
    modal.appendChild(finButton);
    modal.appendChild(techButton);

    // Append modal to the body
    document.body.appendChild(modal);

    const style = document.createElement('style');
    style.textContent = `
        .modal-button {
            padding: 12px 24px;
            background-color: rgb(17, 100, 102);
            color: rgb(255, 255, 255);
            border-radius: 12px;
            border: none;
            cursor: pointer;
            box-shadow: rgba(0, 0, 0, 0.1) 0px 4px 6px;
            transition: background-color 0.3s, transform 0.2s;
            transform: scale(1);
        }
        .modal-button:hover {
            background-color: rgb(17, 81, 83);
        }
        .modal-button:active {
            transform: scale(0.95);
            box-shadow: rgba(0, 0, 0, 0.2) 0px 2px 4px;
        }
        .checklist-item {
            display: flex;
            align-items: center;
            padding: 5px;
            cursor: pointer;
        }
        .checklist-item .checkbox {
            width: 20px;
            height: 20px;
            border: 2px solid #ccc;
            border-radius: 4px;
            margin-right: 10px;
            position: relative;
        }
        .checklist-item .checkbox.checked {
            background-color: #116466;
            border-color: #116466;
        }
        .checklist-item .checkbox.checked::after {
            content: '';
            position: absolute;
            left: 6px;
            width: 6px;
            height: 12px;
            border: solid white;
            border-width: 0 2px 2px 0;
            transform: rotate(45deg);
        }
        .warning-modal {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: white;
            padding: 20px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            border-radius: 10px;
            text-align: center;
        }
        .warning-modal button {
            margin: 10px;
            padding: 10px 20px;
            background-color: rgb(17, 100, 102);
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        }
        .warning-modal button:hover {
            background-color: rgb(17, 81, 83);
        }
    `;
    document.head.appendChild(style);

    // Make the modal draggable by the header
    let isDragging = false;
    let mouseIsDown = false;
    let curSX = 0;
    let curSY = 0;

    header.addEventListener('mousedown', function(e) {
        mouseIsDown = true;
        curSX = e.clientX;
        curSY = e.clientY;
    });

    document.addEventListener('mouseup', function() {
        isDragging = false;
        mouseIsDown = false;
    });

    document.addEventListener('mousemove', function(e) {
        if (mouseIsDown) {
            isDragging = true;
            const deltaX = curSX - e.clientX;
            const deltaY = curSY - e.clientY;
            const newLeft = modal.offsetLeft - deltaX;
            const newTop = modal.offsetTop - deltaY;
            modal.style.left = `${newLeft}px`;
            modal.style.top = `${newTop}px`;
            curSX = e.clientX;
            curSY = e.clientY;
        }
    });

    // Handle button clicks
    finButton.addEventListener('click', function() {
        showQuestions('fin');
    });

    techButton.addEventListener('click', function() {
        showQuestions('tech');
    });

    function showQuestions(type) {
        modal.innerHTML = '';
        modal.appendChild(header);

        // Create questions
        const questions = type === 'fin' ? finQuestions : techQuestions;
        questions.forEach(question => {
            const questionButton = document.createElement('button');
            questionButton.textContent = question.text;
            questionButton.style.margin = '10px';
            questionButton.classList.add('modal-button');
            questionButton.addEventListener('click', function() {
                showChecklist(question, type);
            });
            modal.appendChild(questionButton);
        });

        // Create back and call completed buttons container
        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.marginTop = '20px';
        buttonsContainer.style.display = 'flex';
        buttonsContainer.style.justifyContent = 'space-between';

        // Create back button
        const backButton = document.createElement('button');
        backButton.textContent = 'Назад';
        backButton.classList.add('modal-button');
        backButton.addEventListener('click', function() {
            showQuestions(type);
        });

        // Append buttons to the container
        buttonsContainer.appendChild(backButton);

        // Append buttons container to the modal
        modal.appendChild(buttonsContainer);
    }

    function showChecklist(question, type) {
        // Clear the modal content
        modal.innerHTML = '';
        modal.appendChild(header);

        // Create common checklist
        const commonChecklist = document.createElement('div');
        commonChecklist.classList.add('common-checklist');
        commonChecklist.style.display = "flex";
        commonChecklist.style.flexDirection = "column";
        commonChecklist.style.alignItems = "baseline";
        commonChecklist.innerHTML = `
            <div class="checklist-item">
                <div class="checkbox"></div>
                <div>Сверил адрес</div>
            </div>
            <div class="checklist-item">
                <div class="checkbox"></div>
                <div>Актуализировал номера телефонов</div>
            </div>
            <div class="checklist-item">
                <div class="checkbox"></div>
                <div>Назвал даты окончания тарифных планов</div>
            </div>
        `;

        const commonChecklistItems = commonChecklist.querySelectorAll('.checklist-item');
        commonChecklistItems.forEach(item => {
            item.addEventListener('click', function() {
                item.querySelector('.checkbox').classList.toggle('checked');
            });
        });

        // Create individual checklist
        const individualChecklist = document.createElement('div');
        individualChecklist.classList.add('individual-checklist');
        individualChecklist.style.display = "flex";
        individualChecklist.style.flexDirection = "column";
        individualChecklist.style.alignItems = "baseline";
        individualChecklist.style.paddingTop = "10px";
        individualChecklist.style.borderTop = '1px solid #dedede';
        individualChecklist.innerHTML = question.criteria;

        const individualChecklistItems = individualChecklist.querySelectorAll('.checklist-item');
        individualChecklistItems.forEach(item => {
            item.addEventListener('click', function() {
                item.querySelector('.checkbox').classList.toggle('checked');
            });
        });

        // Create back and call completed buttons container
        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.display = 'flex';
        buttonsContainer.style.justifyContent = 'space-between';
        buttonsContainer.style.paddingTop = "10px";
        buttonsContainer.style.borderTop = '1px solid #dedede';

        // Create back button
        const backButton = document.createElement('button');
        backButton.textContent = 'Назад';
        backButton.classList.add('modal-button');
        backButton.addEventListener('click', function() {
            if (areAllCheckboxesChecked()) {
                showQuestions(type);
            } else {
                showWarning(() => {
                    showQuestions(type);
                });
            }
        });

        // Create call completed button
        const callCompletedButton = document.createElement('button');
        callCompletedButton.textContent = 'Звонок завершен';
        callCompletedButton.classList.add('modal-button');
        callCompletedButton.style.backgroundColor = "#FF3B30";
        callCompletedButton.addEventListener('click', function() {
            if (areAllCheckboxesChecked()) {
                modal.style.display = 'none';
                clearCheckboxes();
                showInitialMenu();
            } else {
                showWarning(() => {
                    modal.style.display = 'none';
                    clearCheckboxes();
                    showInitialMenu();
                });
            }
        });

        // Append buttons to the container
        buttonsContainer.appendChild(backButton);
        buttonsContainer.appendChild(callCompletedButton);

        // Append checklists and buttons container to the modal
        modal.appendChild(commonChecklist);
        modal.appendChild(individualChecklist);
        modal.appendChild(buttonsContainer);
    }

    function areAllCheckboxesChecked() {
        const allCheckboxes = modal.querySelectorAll('.checkbox');
        return Array.from(allCheckboxes).every(checkbox => checkbox.classList.contains('checked'));
    }

    function showWarning(callback) {
        const warningModal = document.createElement('div');
        warningModal.classList.add('warning-modal');
        warningModal.innerHTML = `
            <p>Ты не проверил все, ты уверен?</p>
            <button id="warning-yes">Да</button>
            <button id="warning-no">Нет</button>
        `;
        document.body.appendChild(warningModal);

        const yesButton = warningModal.querySelector('#warning-yes');
        const noButton = warningModal.querySelector('#warning-no');

        yesButton.addEventListener('click', function() {
            document.body.removeChild(warningModal);
            callback();
        });

        noButton.addEventListener('click', function() {
            document.body.removeChild(warningModal);
        });
    }

    function clearCheckboxes() {
        const allCheckboxes = modal.querySelectorAll('.checkbox');
        allCheckboxes.forEach(checkbox => checkbox.classList.remove('checked'));
    }

    function showInitialMenu() {
        modal.innerHTML = '';
        modal.appendChild(header);
        modal.appendChild(finButton);
        modal.appendChild(techButton);
    }

    const finQuestions = [
        { text: 'Вопрос 1', criteria: `
            <div class="checklist-item">
                <div class="checkbox"></div>
                <div>Индивидуальный чекбокс 1 для Вопрос 1</div>
            </div>
            <div class="checklist-item">
                <div class="checkbox"></div>
                <div>Индивидуальный чекбокс 2 для Вопрос 1</div>
            </div>
        ` },
        { text: 'Вопрос 2', criteria: `
            <div class="checklist-item">
                <div class="checkbox"></div>
                <div>Индивидуальный чекбокс 1 для Вопрос 2</div>
            </div>
            <div class="checklist-item">
                <div class="checkbox"></div>
                <div>Индивидуальный чекбокс 2 для Вопрос 2</div>
            </div>
        ` },
    ];

    const techQuestions = [
        { text: 'Тех Вопрос 1', criteria: `
            <div class="checklist-item">
                <div class="checkbox"></div>
                <div>Индивидуальный чекбокс 1 для Тех Вопрос 1</div>
            </div>
            <div class="checklist-item">
                <div class="checkbox"></div>
                <div>Индивидуальный чекбокс 2 для Тех Вопрос 1</div>
            </div>
        ` },
        { text: 'Тех Вопрос 2', criteria: `
            <div class="checklist-item">
                <div class="checkbox"></div>
                <div>Индивидуальный чекбокс 1 для Тех Вопрос 2</div>
            </div>
            <div class="checklist-item">
                <div class="checkbox"></div>
                <div>Индивидуальный чекбокс 2 для Тех Вопрос 2</div>
            </div>
        ` },
    ];

    // Wait for 3 seconds before executing the script
    setTimeout(function() {
        modal.style.display = "block";
    }, 3000);
})();
