# Build the Vite app. Config is NOT baked at build time — the release
# pipeline's secret set reaches the container as runtime env vars instead.
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Serve the static build. The platform enforces run-as-non-root, so nginx
# runs as USER 1000 on the unprivileged port 8080 with all writable state
# (pid, temp, logs) redirected. nginx-env.sh (the 40-env entrypoint hook)
# writes the VITE_* secret-set vars into env.js at container start, so the
# html directory must be writable by the app user.
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
RUN chown -R 1000:1000 /usr/share/nginx/html
COPY --chmod=755 nginx-env.sh /docker-entrypoint.d/40-env.sh
COPY nginx.conf /etc/nginx/nginx.conf
COPY nginx-default.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
USER 1000
