# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS dependencies

WORKDIR /app

# Копируем корневой package.json для workspaces
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

# Копируем корневые конфиги TypeScript
COPY tsconfig.base.json ./
COPY tsconfig.json ./

# ИСПРАВЛЕНИЕ: Копируем только корневой node_modules (он содержит всё)
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

# Копируем корневые конфиги
COPY tsconfig.base.json ./
COPY tsconfig.json ./

# ИСПРАВЛЕНИЕ: Копируем только корневой node_modules
COPY --from=dependencies /app/node_modules ./node_modules

# Копируем собранный shared-types
COPY --from=shared-builder /app/shared-types/dist ./shared-types/dist
COPY --from=shared-builder /app/shared-types/package.json ./shared-types/
COPY --from=shared-builder /app/shared-types/tsconfig*.json ./shared-types/

# Копируем исходники фронтенда
COPY frontend/ ./frontend/

WORKDIR /app/frontend
# Примечание: Убедитесь, что этот скрипт есть в frontend/package.json
#RUN npm run build

EXPOSE 4200

CMD ["npx", "ng", "serve", "--host", "0.0.0.0", "--port", "4200", "--proxy-config", "proxy.conf.docker.json", "--poll", "1000"]


# ============================================
# Stage 4: Production Builder
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем корневые конфиги
COPY tsconfig.base.json ./
COPY tsconfig.json ./

# ИСПРАВЛЕНИЕ: Копируем только корневой node_modules
COPY --from=dependencies /app/node_modules ./node_modules

# Копируем собранный shared-types
COPY --from=shared-builder /app/shared-types/dist ./shared-types/dist
COPY --from=shared-builder /app/shared-types/package.json ./shared-types/
COPY --from=shared-builder /app/shared-types/tsconfig*.json ./shared-types/

# Копируем исходники фронтенда
COPY frontend/ ./frontend/

# Собираем production версию
WORKDIR /app/frontend
RUN npm run build:prod


# ============================================
# Stage 5: Production (Nginx)
# ============================================
FROM nginx:alpine AS production

# Копируем собранный фронтенд (проверьте путь dist/frontend/browser, он зависит от angular.json)
COPY --from=builder /app/frontend/dist/frontend/browser /usr/share/nginx/html

# Настраиваем Nginx
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    \
    gzip on; \
    gzip_comp_level 6; \
    gzip_vary on; \
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript; \
    \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
        add_header Cache-Control "public, max-age=3600"; \
    } \
    \
    location /api { \
        proxy_pass http://backend:3000; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
        proxy_cache_bypass $http_upgrade; \
        proxy_read_timeout 60s; \
    } \
    \
    location /assets/ { \
        root /usr/share/nginx/html; \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Оптимизация Nginx
RUN echo 'worker_processes auto; \
    events { \
        worker_connections 1024; \
        multi_accept on; \
    }' > /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]