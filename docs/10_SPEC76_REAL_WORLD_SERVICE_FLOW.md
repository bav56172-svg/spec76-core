
# SPEC76 OS — FIRST REAL-WORLD SERVICE FLOW v1

---

# 🧠 1. ГЛАВНАЯ ЦЕЛЬ FLOW

Показать полный цикл:

> от запроса человека → до выполнения реальной услуги → до оплаты

---

# 🧠 2. РЕАЛЬНЫЙ СЦЕНАРИЙ (БАЗОВЫЙ)

## 🟢 Пример:

Пользователь:

> “Нужно убрать снег во дворе”

---

# 🧠 3. ЭТАП 1 — USER REQUEST

## 🟢 User Input (вход пользователя)

Пользователь вводит:

- что нужно сделать
- где
- когда
- срочность

---

## 🟢 SYSTEM ACTION:

AI начинает обработку:

### AI Interpretation (AI интерпретация)

- “уборка снега” → Cleaning Service (услуга уборки)
- локация → зона выполнения
- срочность → priority level

---

# 🧠 4. ЭТАП 2 — TASK CREATION

## 🟢 создаётся Task (задача)

```text id="task"
Task:
- type: Snow Removal (уборка снега)
- location: двор / территория
- priority: medium/high
- status: created