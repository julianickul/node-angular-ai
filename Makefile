# ============================================
# Переменные
# ============================================
DOCKER_COMPOSE = docker-compose
DOCKER_COMPOSE_PROD = $(DOCKER_COMPOSE) --profile production
ENV_FILE = .env

# Цвета для вывода
GREEN = \033[0;32m
RED = \033[0;31m
YELLOW = \033[0;33m
NC = \033[0m # No Color

# ============================================
# Основные команды
# ============================================

.PHONY: help
help: ## Показать справку по командам
	@echo "$(GREEN)Доступные команды:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'

.PHONY: start
start: ## Запустить все контейнеры в фоне
	@echo "$(GREEN)🚀 Запуск контейнеров...$(NC)"
	$(DOCKER_COMPOSE) --env-file $(ENV_FILE) up -d
	@echo "$(GREEN)✅ Контейнеры запущены!$(NC)"
	@echo "$(YELLOW)📊 phpMyAdmin: http://localhost:$(shell grep PMA_PORT $(ENV_FILE) | cut -d '=' -f2)$(NC)"
	@echo "$(YELLOW)🔧 Backend: http://localhost:$(shell grep BACKEND_PORT $(ENV_FILE) | cut -d '=' -f2)/api$(NC)"
	@echo "$(YELLOW)🎨 Frontend: http://localhost:$(shell grep FRONTEND_DEV_PORT $(ENV_FILE) | cut -d '=' -f2)$(NC)"

.PHONY: start-prod
start-prod: ## Запустить контейнеры в production режиме (с Nginx)
	@echo "$(GREEN)🚀 Запуск контейнеров в production режиме...$(NC)"
	$(DOCKER_COMPOSE_PROD) --env-file $(ENV_FILE) up -d
	@echo "$(GREEN)✅ Контейнеры запущены!$(NC)"
	@echo "$(YELLOW)🌐 Frontend (Nginx): http://localhost:$(shell grep FRONTEND_PROD_PORT $(ENV_FILE) | cut -d '=' -f2)$(NC)"

.PHONY: stop
stop: ## Остановить все контейнеры
	@echo "$(YELLOW)🛑 Остановка контейнеров...$(NC)"
	$(DOCKER_COMPOSE) stop
	@echo "$(GREEN)✅ Контейнеры остановлены$(NC)"

.PHONY: down
down: ## Остановить и удалить контейнеры (сохраняет volume)
	@echo "$(YELLOW)🧹 Остановка и удаление контейнеров...$(NC)"
	$(DOCKER_COMPOSE) down
	@echo "$(GREEN)✅ Контейнеры удалены (данные сохранены)$(NC)"

.PHONY: down-clean
down-clean: ## Полная очистка (контейнеры + volumes + образы)
	@echo "$(RED)⚠️  Полная очистка...$(NC)"
	$(DOCKER_COMPOSE) down -v --rmi all --remove-orphans
	@echo "$(GREEN)✅ Полная очистка выполнена$(NC)"

.PHONY: logs
logs: ## Показать логи всех контейнеров
	$(DOCKER_COMPOSE) logs -f

.PHONY: logs-backend
logs-backend: ## Показать логи бэкенда
	$(DOCKER_COMPOSE) logs -f backend

.PHONY: logs-frontend
logs-frontend: ## Показать логи фронтенда
	$(DOCKER_COMPOSE) logs -f frontend-dev

.PHONY: logs-db
logs-db: ## Показать логи базы данных
	$(DOCKER_COMPOSE) logs -f db

.PHONY: logs-pma
logs-pma: ## Показать логи phpMyAdmin
	$(DOCKER_COMPOSE) logs -f phpmyadmin

.PHONY: restart
restart: stop start ## Перезапустить все контейнеры

.PHONY: rebuild
rebuild: ## Пересобрать образы и запустить
	@echo "$(YELLOW)🔨 Пересборка образов...$(NC)"
	$(DOCKER_COMPOSE) build --no-cache
	$(MAKE) start

.PHONY: shell-backend
shell-backend: ## Войти в shell бэкенда
	$(DOCKER_COMPOSE) exec backend /bin/sh

.PHONY: shell-frontend
shell-frontend: ## Войти в shell фронтенда
	$(DOCKER_COMPOSE) exec frontend-dev /bin/sh

.PHONY: shell-db
shell-db: ## Войти в MySQL shell
	$(DOCKER_COMPOSE) exec db mysql -u root -p$(shell grep DB_ROOT_PASSWORD $(ENV_FILE) | cut -d '=' -f2)

.PHONY: ps
ps: ## Показать статус контейнеров
	$(DOCKER_COMPOSE) ps

.PHONY: status
status: ps ## Алиас для ps

.PHONY: migrate
migrate: ## Запустить миграции бэкенда
	@echo "$(YELLOW)🔄 Запуск миграций...$(NC)"
	$(DOCKER_COMPOSE) exec backend npm run migration:run

.PHONY: migrate-generate
migrate-generate: ## Сгенерировать новую миграцию (используйте name=ИмяМиграции)
	@if [ -z "$(name)" ]; then \
		echo "$(RED)❌ Ошибка: укажите имя миграции через name=ИмяМиграции$(NC)"; \
		echo "$(YELLOW)Пример: make migrate-generate name=AddUserTable$(NC)"; \
		exit 1; \
	fi
	$(DOCKER_COMPOSE) exec backend npm run migration:generate --name=$(name)

.PHONY: seed
seed: ## Заполнить БД тестовыми данными
	@echo "$(YELLOW)🌱 Заполнение БД тестовыми данными...$(NC)"
	$(DOCKER_COMPOSE) exec backend npm run seed

.PHONY: clean
clean: ## Очистить все Docker ресурсы (контейнеры, образы, volumes, сети)
	@echo "$(RED)⚠️  Очистка всех Docker ресурсов...$(NC)"
	docker system prune -af --volumes
	@echo "$(GREEN)✅ Очистка выполнена$(NC)"

.PHONY: logs-clean
logs-clean: ## Очистить логи контейнеров
	@echo "$(YELLOW)🧹 Очистка логов...$(NC)"
	$(DOCKER_COMPOSE) logs --no-log-prefix > /dev/null 2>&1 || true
	@echo "$(GREEN)✅ Логи очищены$(NC)"

.PHONY: health
health: ## Проверить здоровье контейнеров
	@echo "$(YELLOW)🏥 Проверка здоровья контейнеров...$(NC)"
	@$(DOCKER_COMPOSE) ps --format "table {{.Name}}\t{{.Status}}" | grep -v "Exit" || echo "Нет запущенных контейнеров"

.PHONY: backup-db
backup-db: ## Создать бэкап БД (сохраняется в ./backups/)
	@mkdir -p backups
	@echo "$(YELLOW)💾 Создание бэкапа БД...$(NC)"
	$(DOCKER_COMPOSE) exec db mysqldump -u $(shell grep DB_USER $(ENV_FILE) | cut -d '=' -f2) -p$(shell grep DB_PASSWORD $(ENV_FILE) | cut -d '=' -f2) $(shell grep DB_NAME $(ENV_FILE) | cut -d '=' -f2) > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)✅ Бэкап создан в папке backups/$(NC)"

.PHONY: restore-db
restore-db: ## Восстановить БД из бэкапа (используйте file=путь_к_файлу)
	@if [ -z "$(file)" ]; then \
		echo "$(RED)❌ Ошибка: укажите путь к файлу через file=путь_к_файлу$(NC)"; \
		echo "$(YELLOW)Пример: make restore-db file=backups/backup_20231201_120000.sql$(NC)"; \
		exit 1; \
	fi
	@echo "$(YELLOW)🔄 Восстановление БД из $(file)...$(NC)"
	cat $(file) | $(DOCKER_COMPOSE) exec -T db mysql -u $(shell grep DB_USER $(ENV_FILE) | cut -d '=' -f2) -p$(shell grep DB_PASSWORD $(ENV_FILE) | cut -d '=' -f2) $(shell grep DB_NAME $(ENV_FILE) | cut -d '=' -f2)
	@echo "$(GREEN)✅ БД восстановлена$(NC)"

.PHONY: install
install: ## Установить зависимости во всех контейнерах
	@echo "$(YELLOW)📦 Установка зависимостей...$(NC)"
	$(DOCKER_COMPOSE) exec backend npm install
	$(DOCKER_COMPOSE) exec frontend-dev npm install
	@echo "$(GREEN)✅ Зависимости установлены$(NC)"

.PHONY: build
build: ## Собрать все приложения без запуска
	@echo "$(YELLOW)🔨 Сборка всех приложений...$(NC)"
	$(DOCKER_COMPOSE) build
	@echo "$(GREEN)✅ Сборка завершена$(NC)"

# ============================================
# Команды по умолчанию
# ============================================

.DEFAULT_GOAL := help
