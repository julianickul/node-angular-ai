# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS dependencies

WORKDIR /app

# Копируем корневой package.json для workspaces (ОБЯЗАТЕЛЬНО для бэкенда тоже)
COPY package*.json ./

# Копируем package.json всех проектов
COPY frontend/package*.json ./frontend/
COPY shared-types/package*.json ./shared-types/
COPY backend/package*.json ./backend/

# Устанавливаем все зависимости через npm workspaces
RUN npm i --legacy-peer-deps --workspaces --include-workspace-root --ignore-scripts


# ============================================
# Stage 2: Build shared-types
# ============================================
FROM node:20-alpine AS shared-builder

WORKDIR /app

# Копируем корневой node_modules
COPY --from=dependencies /app/node_modules ./node_modules

# Копируем исходники shared-types
COPY shared-types/ ./shared-types/

# Собираем shared-types
WORKDIR /app/shared-types
RUN npm run build


# ============================================
# Stage 3: Development
# ============================================
FROM node:20-alpine AS development

WORKDIR /app

# Копируем корневой node_modules
COPY --from=dependencies /app/node_modules ./node_modules

# Копируем собранный shared-types
COPY --from=shared-builder /app/shared-types/dist ./shared-types/dist
COPY --from=shared-builder /app/shared-types/package.json ./shared-types/

# Копируем исходники бэкенда
COPY backend/ ./backend/

# Устанавливаем nodemon глобально для hot-reload
RUN npm install -g nodemon
RUN npm install -g @nestjs/cli

WORKDIR /app/backend

EXPOSE 3000

CMD ["nest", "npm", "run", "start:dev"]


# ============================================
# Stage 4: Builder (для production)
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем корневой node_modules
COPY --from=dependencies /app/node_modules ./node_modules

# Копируем собранный shared-types
COPY --from=shared-builder /app/shared-types/dist ./shared-types/dist
COPY --from=shared-builder /app/shared-types/package.json ./shared-types/

# Копируем исходники бэкенда
COPY backend/ ./backend/

# Собираем бэкенд
WORKDIR /app/backend
RUN npm run build


# ============================================
# Stage 5: Production
# ============================================
FROM node:20-alpine AS production

WORKDIR /app

# Копируем корневой node_modules (он содержит все prod-зависимости)
COPY --from=dependencies /app/node_modules ./node_modules

# Копируем собранное приложение
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/package*.json ./

# Копируем shared-types (для корректной работы, если бэкенд ссылается на него)
COPY --from=shared-builder /app/shared-types/dist ./shared-types/dist
COPY --from=shared-builder /app/shared-types/package.json ./shared-types/

# Создаем пользователя node для безопасности
USER node

EXPOSE 3000

CMD ["node", "dist/main"]
