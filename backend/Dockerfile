# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS dependencies

WORKDIR /app

# Копируем package.json для всех проектов
COPY backend/package*.json ./backend/
COPY shared-types/package*.json ./shared-types/

# Устанавливаем зависимости
RUN cd backend && npm i --legacy-peer-deps
RUN cd shared-types && npm i

# ============================================
# Stage 2: Build shared-types
# ============================================
FROM node:20-alpine AS shared-builder

WORKDIR /app

# Копируем зависимости shared-types
COPY --from=dependencies /app/shared-types/node_modules ./shared-types/node_modules
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

# Копируем зависимости бэкенда
COPY --from=dependencies /app/backend/node_modules ./backend/node_modules

# Копируем собранный shared-types (dist + package.json)
COPY --from=shared-builder /app/shared-types/dist ./shared-types/dist
COPY --from=shared-builder /app/shared-types/package.json ./shared-types/

# Копируем исходники бэкенда
COPY backend/ ./backend/

# Устанавливаем nodemon для hot-reload
RUN npm install -g nodemon

WORKDIR /app/backend

EXPOSE 3000

CMD ["npm", "run", "start:dev"]

# ============================================
# Stage 4: Builder (для production)
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем зависимости бэкенда
COPY --from=dependencies /app/backend/node_modules ./backend/node_modules

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

# Копируем production зависимости
COPY --from=dependencies /app/backend/node_modules ./node_modules

# Копируем собранное приложение
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/package*.json ./

# Копируем shared-types
COPY --from=shared-builder /app/shared-types/dist ../shared-types/dist
COPY --from=shared-builder /app/shared-types/package.json ../shared-types/

# Создаем пользователя node для безопасности
USER node

EXPOSE 3000

CMD ["node", "dist/main"]