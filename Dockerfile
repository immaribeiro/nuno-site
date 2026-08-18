# --- build frontend ---
FROM node:20-alpine AS frontend
WORKDIR /build
COPY package.json package-lock.json* ./
RUN npm ci
COPY . ./
RUN npm run build

# --- runtime ---
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=frontend /build/dist /usr/share/nginx/html
EXPOSE 80
