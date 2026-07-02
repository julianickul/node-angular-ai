# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS dependencies

WORKDIR /app

# Копируем package.json
COPY frontend/package*.json ./frontend/
COPY shared-types/package*.json ./shared-types/

# Устанавливаем зависимости
RUN cd frontend && npm i --legacy-peer-deps
RUN cd shared-types && npm i

# ============================================
# Stage 2: Build shared-types
# ============================================
FROM node:20-alpine AS shared-builder

WORKDIR /app

COPY --from=dependencies /app/shared-types/node_modules ./shared-types/node_modules
COPY shared-types/ ./shared-types/

WORKDIR /app/shared-types
RUN npm run build

# ============================================
# Stage 3: Development
# ============================================
FROM node:20-alpine AS development

WORKDIR /app

# Копируем зависимости фронтенда
COPY --from=dependencies /app/frontend/node_modules ./frontend/node_modules

# Копируем собранный shared-types
COPY --from=shared-builder /app/shared-types/dist ./shared-types/dist
COPY shared-types/package.json ./shared-types/

# Копируем исходники фронтенда
COPY frontend/ ./frontend/

# Устанавливаем Angular CLI
RUN npm install -g @angular/cli@19

# Создаем proxy для Docker
RUN echo '{"api": {"target": "http://backend:3000","secure": false,"changeOrigin": true}}' > ./frontend/proxy.conf.docker.json

WORKDIR /app/frontend

EXPOSE 4200

CMD ["ng", "serve", "--host", "0.0.0.0", "--proxy-config", "proxy.conf.docker.json"]

# ============================================
# Stage 4: Production (Nginx)
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=dependencies /app/frontend/node_modules ./frontend/node_modules
COPY --from=shared-builder /app/shared-types/dist ./shared-types/dist
COPY shared-types/package.json ./shared-types/
COPY frontend/ ./frontend/

WORKDIR /app/frontend
RUN npm run build:prod

FROM nginx:alpine AS production

COPY --from=builder /app/frontend/dist/frontend/browser /usr/share/nginx/html

RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
    location /api { \
        proxy_pass http://backend:3000; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]