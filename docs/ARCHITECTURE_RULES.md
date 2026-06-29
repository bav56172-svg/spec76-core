# Стандарты маршрутов SPEC76 OS

Каждая сущность имеет одинаковый жизненный цикл.

Список:
/projects

Создание:
/projects/new

Просмотр:
/projects/{id}

Редактирование:
/projects/{id}/edit
## Работа с данными

Страницы (`app/...`) не должны обращаться к Supabase напрямую.

Любая работа с данными выполняется только через сервисы (`services/...`).

Пример:

❌ Плохо

app/projects/page.tsx

supabase.from("projects")

✅ Хорошо

getProjects()

createProject()

updateProject()

deleteProject()

getCurrentUserCompany()