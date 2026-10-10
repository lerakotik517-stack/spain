/* ========================================
   MI ESPAÑOL — КАРТКИ ТА ТЕСТИ
======================================== */

const STORAGE_KEY = "mi-espanol-cards-v1";
const QUESTIONS_KEY = "mi-espanol-questions-v1";

const $ = (selector) => document.querySelector(selector);

const SECTIONS = {
    words: { title: "Слова", short: "СЛОВО" },
    sentences: { title: "Речення", short: "РЕЧЕННЯ" },
    verbs: { title: "Дієслова", short: "ДІЄСЛОВО" },
    grammar: { title: "Граматика", short: "ГРАМАТИКА" }
};

let cards = loadCards();
let questions = loadQuestions();

let activeSection = "all";
let editingId = null;
let editingQuestionId = null;

let quizQuestions = [];
let quizIndex = 0;
let quizScore = 0;
let answered = false;
let quizResults = [];


/* ========================================
   ДОПОМІЖНІ ФУНКЦІЇ
======================================== */

function element(tag, className = "", text = "") {
    const node = document.createElement(tag);

    if (className) {
        node.className = className;
    }

    if (text !== "") {
        node.textContent = text;
    }

    return node;
}

function button(text, className, onClick) {
    const node = element("button", className, text);

    node.type = "button";
    node.addEventListener("click", onClick);

    return node;
}

function createId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}


/* ========================================
   ЗБЕРЕЖЕННЯ КАРТОК
======================================== */

function loadCards() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

        if (!Array.isArray(saved)) {
            return [];
        }

        return saved.filter(card =>
            card &&
            typeof card.id === "string" &&
            typeof card.spanish === "string" &&
            typeof card.translation === "string" &&
            SECTIONS[card.section]
        );
    } catch {
        return [];
    }
}

function saveCards() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    } catch {
        alert("Не вдалося зберегти картки. Перевір пам'ять браузера.");
    }
}


/* ========================================
   ВІДОБРАЖЕННЯ КАРТОК
======================================== */

function renderCards() {
    const container = $("#cards");

    if (!container) return;

    container.replaceChildren();

    const visibleCards = cards.filter(card =>
        activeSection === "all" ||
        card.section === activeSection
    );

    if ($("#counter")) {
        $("#counter").textContent = cards.length;
    }

    if (visibleCards.length === 0) {
        const empty = element("div", "empty");

        empty.appendChild(element("div", "empty-mark", "+"));

        empty.appendChild(element(
            "p",
            "",
            activeSection === "all"
                ? "Тут поки порожньо. Натисни +, щоб додати свою першу картку."
                : "У цьому розділі поки немає карток. Додай свою!"
        ));

        container.appendChild(empty);
        return;
    }

    visibleCards.forEach(card => {
        container.appendChild(createCard(card));
    });
}

function createCard(card) {
    if (editingId === card.id) {
        const editingCard = element("article", "flashcard");
        const face = element("div", "card-face");

        face.style.position = "relative";
        face.style.minHeight = "0";
        face.style.height = "100%";

        renderCardEditor(face, card);
        editingCard.appendChild(face);

        return editingCard;
    }

    const cardNode = element("article", "flashcard");
    const inner = element("div", "card-inner");

    /* Лицьова сторона */

    const front = element("div", "card-face card-front");
    const frontMeta = element("div", "card-meta");

    frontMeta.appendChild(
        element("span", "", SECTIONS[card.section].short)
    );

    frontMeta.appendChild(element("span", "", "ES"));

    front.appendChild(frontMeta);
    front.appendChild(element("p", "card-text", card.spanish));

    const frontBottom = element("div", "card-bottom");

    frontBottom.appendChild(
        element("span", "card-hint", "Натисни, щоб перевернути")
    );

    const frontActions = element("div", "card-actions");

    frontActions.appendChild(button("✎", "icon-button", event => {
        event.stopPropagation();

        editingId = card.id;
        renderCards();
    }));

    frontActions.appendChild(button("×", "icon-button", event => {
        event.stopPropagation();

        deleteCard(card.id);
    }));

    frontBottom.appendChild(frontActions);
    front.appendChild(frontBottom);

    /* Зворотна сторона */

    const back = element("div", "card-face card-back");
    const backMeta = element("div", "card-meta");

    backMeta.appendChild(element("span", "", "ПЕРЕКЛАД"));
    backMeta.appendChild(element("span", "", "UA"));

    back.appendChild(backMeta);
    back.appendChild(element("p", "card-text", card.translation));

    const backBottom = element("div", "card-bottom");

    backBottom.appendChild(
        element("span", "card-hint", "Натисни, щоб повернути")
    );

    backBottom.appendChild(button("↻", "icon-button", event => {
        event.stopPropagation();

        cardNode.classList.toggle("flipped");
    }));

    back.appendChild(backBottom);

    inner.append(front, back);
    cardNode.appendChild(inner);

    cardNode.addEventListener("click", event => {
        if (event.target.closest("button")) return;

        cardNode.classList.toggle("flipped");
    });

    return cardNode;
}

function createEditField(labelText, value, maxLength = 2000) {
    const label = element("label", "field");

    label.appendChild(element("span", "", labelText));

    const textarea = document.createElement("textarea");

    textarea.value = value;
    textarea.maxLength = maxLength;
    textarea.required = true;

    label.appendChild(textarea);

    return textarea;
}

function renderCardEditor(container, card) {
    const area = element("div", "edit-area");

    const spanishField = createEditField(
        "Іспанською",
        card.spanish
    );

    const translationField = createEditField(
        "Переклад",
        card.translation
    );

    const sectionLabel = element("label", "field");

    sectionLabel.appendChild(element("span", "", "Розділ"));

    const sectionSelect = document.createElement("select");

    Object.entries(SECTIONS).forEach(([value, info]) => {
        const option = document.createElement("option");

        option.value = value;
        option.textContent = info.title;

        sectionSelect.appendChild(option);
    });

    sectionSelect.value = card.section;
    sectionLabel.appendChild(sectionSelect);

    const actions = element("div", "edit-actions");

    actions.appendChild(button("Зберегти", "primary-button", () => {
        const spanish = spanishField.value.trim();
        const translation = translationField.value.trim();

        if (!spanish || !translation) {
            alert("Заповни обидва поля.");
            return;
        }

        card.spanish = spanish;
        card.translation = translation;
        card.section = sectionSelect.value;

        saveCards();

        editingId = null;
        renderCards();
    }));

    actions.appendChild(button("Скасувати", "secondary-button", () => {
        editingId = null;
        renderCards();
    }));

    area.append(
        spanishField.parentElement,
        translationField.parentElement,
        sectionLabel,
        actions
    );

    container.appendChild(area);
}

function deleteCard(id) {
    if (!confirm("Видалити цю картку?")) return;

    cards = cards.filter(card => card.id !== id);

    saveCards();
    renderCards();
}


/* ========================================
   ДОДАВАННЯ КАРТОК
======================================== */

function showAddForm(show = true) {
    const form = $("#addForm");
    const toggle = $("#addToggle");

    if (!form || !toggle) return;

    form.classList.toggle("hidden", !show);
    toggle.textContent = show ? "×" : "+";

    if (show) {
        $("#newSpanish").focus();

        form.scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        });
    } else {
        form.reset();
    }
}

if ($("#addToggle")) {
    $("#addToggle").addEventListener("click", () => {
        showAddForm($("#addForm").classList.contains("hidden"));
    });
}

if ($("#cancelAdd")) {
    $("#cancelAdd").addEventListener("click", () => {
        showAddForm(false);
    });
}

if ($("#addForm")) {
    $("#addForm").addEventListener("submit", event => {
        event.preventDefault();

        const spanish = $("#newSpanish").value.trim();
        const translation = $("#newTranslation").value.trim();
        const section = $("#newSection").value;

        if (!spanish || !translation || !SECTIONS[section]) {
            return;
        }

        cards.unshift({
            id: createId(),
            spanish,
            translation,
            section
        });

        saveCards();

        activeSection = section;

        document.querySelectorAll(".filter").forEach(filter => {
            filter.classList.toggle(
                "active",
                filter.dataset.section === section
            );
        });

        showAddForm(false);
        renderCards();
    });
}

if ($("#filters")) {
    $("#filters").addEventListener("click", event => {
        const filter = event.target.closest(".filter");

        if (!filter) return;

        activeSection = filter.dataset.section;

        document.querySelectorAll(".filter").forEach(item => {
            item.classList.toggle("active", item === filter);
        });

        renderCards();
    });
}


/* ========================================
   ЗБЕРЕЖЕННЯ ПИТАНЬ
======================================== */

function loadQuestions() {
    try {
        const saved = JSON.parse(localStorage.getItem(QUESTIONS_KEY));

        if (!Array.isArray(saved)) {
            return [];
        }

        return saved.filter(question =>
            question &&
            typeof question.id === "string" &&
            typeof question.q === "string" &&
            typeof question.type === "string" &&
            Array.isArray(question.options) &&
            question.options.length >= 2 &&
            question.options.every(
                option => typeof option === "string" && option.trim()
            ) &&
            Number.isInteger(question.correct) &&
            question.correct >= 0 &&
            question.correct < question.options.length
        );
    } catch {
        return [];
    }
}

function saveQuestions() {
    try {
        localStorage.setItem(
            QUESTIONS_KEY,
            JSON.stringify(questions)
        );
    } catch {
        alert("Не вдалося зберегти питання. Перевір пам'ять браузера.");
    }
}


/* ========================================
   ВІКОНЦЯ
======================================== */

function openModal(id) {
    const modal = document.getElementById(id);

    if (!modal) return;

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");

    document.body.classList.add("modal-open");
}

function closeModal(id) {
    const modal = document.getElementById(id);

    if (!modal) return;

    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");

    if (!document.querySelector(".modal.open")) {
        document.body.classList.remove("modal-open");
    }
}


/* ========================================
   СПИСОК ПИТАНЬ
======================================== */

function openManager() {
    renderQuestionList();
    openModal("questionManagerModal");
}

function renderQuestionList() {
    const list = $("#questionList");

    if (!list) return;

    list.replaceChildren();

    if (questions.length === 0) {
        const empty = element("div", "empty");

        empty.appendChild(element("div", "empty-mark", "?"));

        empty.appendChild(element(
            "p",
            "",
            "Тут поки немає питань. Натисни «Додати питання», щоб створити свій тест."
        ));

        list.appendChild(empty);
        return;
    }

    questions.forEach((question, index) => {
        const item = element("article", "question-list-item");
        const info = element("div", "question-list-copy");

        info.appendChild(element(
            "span",
            "question-list-meta",
            `${index + 1} · ${question.type} · ${question.options.length} варіанти`
        ));

        info.appendChild(element(
            "p",
            "question-list-text",
            question.q
        ));

        info.appendChild(element(
            "p",
            "question-list-answer",
            `✓ ${question.options[question.correct]}`
        ));

        const actions = element("div", "question-list-actions");

        actions.appendChild(button("✎", "icon-button", () => {
            editQuestion(question.id);
        }));

        actions.appendChild(button("×", "icon-button danger-button", () => {
            deleteQuestion(question.id);
        }));

        item.append(info, actions);
        list.appendChild(item);
    });
}


/* ========================================
   СТВОРЕННЯ ПИТАННЯ
======================================== */

function startNewQuestion() {
    editingQuestionId = null;

    $("#questionForm").reset();

    $("#questionTypeInput").value = "";
    $("#editorTitle").textContent = "Нове питання";

    $("#questionOptionsEditor").replaceChildren();

    // Створюються лише порожні поля, без готових відповідей.
    addOptionField("");
    addOptionField("");

    closeModal("questionManagerModal");
    openModal("questionEditorModal");

    $("#questionTextInput").focus();
}


/* ========================================
   РЕДАГУВАННЯ ПИТАННЯ
======================================== */

function editQuestion(id) {
    const question = questions.find(item => item.id === id);

    if (!question) return;

    editingQuestionId = id;

    $("#editorTitle").textContent = "Редагувати питання";
    $("#questionTextInput").value = question.q;
    $("#questionTypeInput").value = question.type;

    $("#questionOptionsEditor").replaceChildren();

    question.options.forEach((option, index) => {
        addOptionField(option, index === question.correct);
    });

    closeModal("questionManagerModal");
    openModal("questionEditorModal");
}


/* ========================================
   ПОЛЯ ВАРІАНТІВ ВІДПОВІДІ
======================================== */

function addOptionField(value = "", isCorrect = false) {
    const container = $("#questionOptionsEditor");

    if (!container || container.children.length >= 6) {
        return;
    }

    const row = element("div", "option-edit-row");

    const radio = document.createElement("input");

    radio.type = "radio";
    radio.name = "correctOption";
    radio.checked = isCorrect;
    radio.setAttribute("aria-label", "Правильна відповідь");
    radio.required = true;

    const input = document.createElement("input");

    input.type = "text";
    input.className = "option-text-input";
    input.maxLength = 500;
    input.placeholder = `Варіант ${container.children.length + 1}`;
    input.value = value;
    input.required = true;

    const remove = button("×", "icon-button danger-button", () => {
        if (container.children.length <= 2) {
            alert("Залиши щонайменше 2 варіанти.");
            return;
        }

        const wasChecked = radio.checked;

        row.remove();

        updateOptionPlaceholders();

        if (wasChecked) {
            const firstRadio = container.querySelector(
                'input[name="correctOption"]'
            );

            if (firstRadio) {
                firstRadio.checked = true;
            }
        }
    });

    row.append(radio, input, remove);
    container.appendChild(row);

    updateOptionPlaceholders();
}

function updateOptionPlaceholders() {
    const rows = [
        ...$("#questionOptionsEditor").querySelectorAll(".option-edit-row")
    ];

    rows.forEach((row, index) => {
        row.querySelector(".option-text-input").placeholder =
            `Варіант ${index + 1}`;
    });
}


/* ========================================
   ВИДАЛЕННЯ ПИТАННЯ
======================================== */

function deleteQuestion(id) {
    if (!confirm("Точно видалити це питання?")) return;

    questions = questions.filter(question => question.id !== id);

    saveQuestions();
    renderQuestionList();
}


/* ========================================
   ПОДІЇ КЕРУВАННЯ ПИТАННЯМИ
======================================== */

if ($("#openQuestionManager")) {
    $("#openQuestionManager").addEventListener("click", openManager);
}

if ($("#addQuestionButton")) {
    $("#addQuestionButton").addEventListener("click", startNewQuestion);
}

if ($("#addOptionButton")) {
    $("#addOptionButton").addEventListener("click", () => {
        if ($("#questionOptionsEditor").children.length >= 6) {
            alert("Можна додати максимум 6 варіантів.");
            return;
        }

        addOptionField("");
    });
}

if ($("#cancelQuestionEdit")) {
    $("#cancelQuestionEdit").addEventListener("click", () => {
        closeModal("questionEditorModal");
        openManager();
    });
}

document.querySelectorAll("[data-close-manager]").forEach(node => {
    node.addEventListener("click", () => {
        closeModal("questionManagerModal");
    });
});

document.querySelectorAll("[data-close-editor]").forEach(node => {
    node.addEventListener("click", () => {
        closeModal("questionEditorModal");
        openManager();
    });
});


/* ========================================
   ЗБЕРЕЖЕННЯ НОВОГО / ВІДРЕДАГОВАНОГО ПИТАННЯ
======================================== */

if ($("#questionForm")) {
    $("#questionForm").addEventListener("submit", event => {
        event.preventDefault();

        const q = $("#questionTextInput").value.trim();
        const type = $("#questionTypeInput").value.trim();

        const rows = [
            ...$("#questionOptionsEditor").querySelectorAll(".option-edit-row")
        ];

        const options = rows.map(row =>
            row.querySelector(".option-text-input").value.trim()
        );

        const correct = rows.findIndex(row =>
            row.querySelector('input[name="correctOption"]').checked
        );

        if (!q || !type) {
            alert("Заповни текст питання та його тему.");
            return;
        }

        if (options.length < 2 || options.some(option => !option)) {
            alert("Заповни щонайменше два варіанти відповіді.");
            return;
        }

        if (correct < 0) {
            alert("Познач правильну відповідь кружечком.");
            return;
        }

        const record = {
            id: editingQuestionId || createId(),
            q,
            type,
            options,
            correct
        };

        if (editingQuestionId) {
            questions = questions.map(question =>
                question.id === editingQuestionId ? record : question
            );
        } else {
            questions.unshift(record);
        }

        saveQuestions();

        closeModal("questionEditorModal");
        openManager();
    });
}


/* ========================================
   ПЕРЕМІШУВАННЯ
======================================== */

function shuffle(array) {
    const result = [...array];

    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
}


/* ========================================
   ПОЧАТОК ТЕСТУ
======================================== */

function openQuiz() {
    if (questions.length === 0) {
        alert("Спочатку додай хоча б одне питання у «Мої питання».");

        openManager();
        return;
    }

    quizQuestions = shuffle(questions).map(question => ({
        ...question,

        answers: shuffle(
            question.options.map((text, index) => ({
                text,
                correct: index === question.correct
            }))
        )
    }));

    quizIndex = 0;
    quizScore = 0;
    answered = false;
    quizResults = [];

    openModal("testModal");

    $("#quizArea").classList.remove("hidden");
    $("#resultArea").classList.add("hidden");

    renderQuestion();
}


/* ========================================
   ВІДОБРАЖЕННЯ ПИТАННЯ В ТЕСТІ
======================================== */

function renderQuestion() {
    const question = quizQuestions[quizIndex];

    if (!question) return;

    answered = false;

    $("#progressLabel").textContent =
        `ЗАПИТАННЯ ${quizIndex + 1} / ${quizQuestions.length}`;

    $("#scoreLabel").textContent = `${quizScore} правильних`;

    $("#progressBar").style.width =
        `${quizIndex / quizQuestions.length * 100}%`;

    $("#questionTag").textContent = question.type;
    $("#question").textContent = question.q;

    $("#questionHint").textContent = "Обери одну правильну відповідь.";

    $("#feedback").textContent = "";
    $("#feedback").className = "feedback";

    $("#nextQuestion").disabled = true;

    $("#nextQuestion").textContent =
        quizIndex === quizQuestions.length - 1
            ? "Побачити результат →"
            : "Наступне запитання →";

    const box = $("#answerOptions");

    box.replaceChildren();

    const letters = ["A", "B", "C", "D", "E", "F"];

    question.answers.forEach((answer, index) => {
        const optionButton = button(
            "",
            "answer-option",
            () => selectAnswer(answer, optionButton)
        );

        optionButton.append(
            element("span", "answer-letter", letters[index]),
            element("span", "", answer.text)
        );

        box.appendChild(optionButton);
    });
}


/* ========================================
   ПЕРЕВІРКА ВІДПОВІДІ
======================================== */

function selectAnswer(selectedAnswer, selectedButton) {
    if (answered) return;

    answered = true;

    const question = quizQuestions[quizIndex];

    const buttons = [
        ...$("#answerOptions").querySelectorAll(".answer-option")
    ];

    buttons.forEach((option, index) => {
        option.disabled = true;

        if (question.answers[index].correct) {
            option.classList.add("correct");
        }
    });

    const correctAnswer = question.answers.find(answer => answer.correct);

    if (selectedAnswer.correct) {
        quizScore++;

        $("#feedback").textContent = "✓ Правильно! ¡Muy bien!";
        $("#feedback").classList.add("good");
    } else {
        selectedButton.classList.add("wrong");

        $("#feedback").textContent =
            `✗ Правильна відповідь: ${correctAnswer.text}`;

        $("#feedback").classList.add("bad");
    }

    quizResults.push({
        question: question.q,
        selected: selectedAnswer.text,
        correct: correctAnswer.text,
        isCorrect: selectedAnswer.correct
    });

    $("#scoreLabel").textContent = `${quizScore} правильних`;

    $("#progressBar").style.width =
        `${((quizIndex + 1) / quizQuestions.length) * 100}%`;

    $("#nextQuestion").disabled = false;
}


/* ========================================
   НАСТУПНЕ ПИТАННЯ
======================================== */

function nextQuestion() {
    if (!answered) return;

    if (quizIndex < quizQuestions.length - 1) {
        quizIndex++;
        renderQuestion();
    } else {
        showResults();
    }
}


/* ========================================
   РЕЗУЛЬТАТИ ТЕСТУ
======================================== */

function showResults() {
    $("#quizArea").classList.add("hidden");
    $("#resultArea").classList.remove("hidden");

    $("#resultScore").textContent =
        `${quizScore}/${quizQuestions.length}`;

    const percent = Math.round(
        quizScore / quizQuestions.length * 100
    );

    let message;

    if (percent >= 90) {
        message = "¡Excelente! Чудовий результат!";
    } else if (percent >= 75) {
        message = "¡Muy bien! Дуже добре!";
    } else if (percent >= 50) {
        message = "Непогано! Ще трохи практики — і буде краще.";
    } else {
        message = "Повтори матеріал і спробуй ще раз.";
    }

    $("#resultText").textContent =
        `${message} Правильних відповідей: ${percent}%.`;

    const details = $("#resultDetails");

    details.replaceChildren();

    quizResults.forEach((result, index) => {
        const item = element("div", "result-item");

        item.appendChild(element(
            "strong",
            "",
            `${index + 1}. ${result.isCorrect ? "✓" : "✗"} ${result.question}`
        ));

        item.appendChild(element(
            "div",
            "",
            `Твоя відповідь: ${result.selected}`
        ));

        if (!result.isCorrect) {
            item.appendChild(element(
                "div",
                "",
                `Правильно: ${result.correct}`
            ));
        }

        details.appendChild(item);
    });
}


/* ========================================
   КНОПКИ ТЕСТУ
======================================== */

function closeQuiz() {
    closeModal("testModal");
}

if ($("#openTest")) {
    $("#openTest").addEventListener("click", openQuiz);
}

if ($("#closeTest")) {
    $("#closeTest").addEventListener("click", closeQuiz);
}

if ($("#closeTestButton")) {
    $("#closeTestButton").addEventListener("click", closeQuiz);
}

if ($("#nextQuestion")) {
    $("#nextQuestion").addEventListener("click", nextQuestion);
}

if ($("#restartTest")) {
    $("#restartTest").addEventListener("click", openQuiz);
}


/* ========================================
   ЗАКРИТТЯ ВІКОН КЛАВІШЕЮ ESC
======================================== */

document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;

    [
        "testModal",
        "questionManagerModal",
        "questionEditorModal"
    ].forEach(id => {
        const modal = document.getElementById(id);

        if (modal && modal.classList.contains("open")) {
            closeModal(id);
        }
    });
});


/* ========================================
   ЗАПУСК
======================================== */

renderCards();
renderQuestionList();