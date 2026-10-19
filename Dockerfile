# Build the Vite app. The release pipeline injects the repo's secret set
# (VITE_BLOCKS_*) as env vars, which Vite bakes in at build time.
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Serve the static build. The SPA fallback keeps client-side deep links
# (/login, /edit, …) resolving to index.html.
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
