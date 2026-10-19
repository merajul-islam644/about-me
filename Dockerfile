# Build the Vite app. The release pipeline injects the repo's secret set
# (VITE_BLOCKS_*) as env vars, which Vite bakes in at build time.
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Serve the static build. The platform enforces run-as-non-root, so nginx
# runs as USER 1000 on the unprivileged port 8080 with all writable state
# (pid, temp, logs) redirected — see the two config files below.
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
COPY nginx-default.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
USER 1000
