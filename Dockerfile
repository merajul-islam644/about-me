# Build the Vite app. The release pipeline passes the repo's secret set as
# kaniko build args — each secret must be DECLARED here as an ARG (kaniko
# silently drops undeclared ones) and exported with ENV so the RUN below
# sees it and Vite bakes it into the bundle.
FROM node:20-alpine AS build
ARG VITE_BLOCKS_API_URL
ARG VITE_BLOCKS_APP_DOMAIN
ARG VITE_BLOCKS_DEV_HOST
ARG VITE_BLOCKS_DEV_PORT
ARG VITE_BLOCKS_OIDC_CLIENT_ID
ARG VITE_BLOCKS_OIDC_SCOPE
ARG VITE_BLOCKS_OIDC_URL
ARG VITE_BLOCKS_PROJECT_KEY
ENV VITE_BLOCKS_API_URL=$VITE_BLOCKS_API_URL \
    VITE_BLOCKS_APP_DOMAIN=$VITE_BLOCKS_APP_DOMAIN \
    VITE_BLOCKS_DEV_HOST=$VITE_BLOCKS_DEV_HOST \
    VITE_BLOCKS_DEV_PORT=$VITE_BLOCKS_DEV_PORT \
    VITE_BLOCKS_OIDC_CLIENT_ID=$VITE_BLOCKS_OIDC_CLIENT_ID \
    VITE_BLOCKS_OIDC_SCOPE=$VITE_BLOCKS_OIDC_SCOPE \
    VITE_BLOCKS_OIDC_URL=$VITE_BLOCKS_OIDC_URL \
    VITE_BLOCKS_PROJECT_KEY=$VITE_BLOCKS_PROJECT_KEY
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Serve the static build. The platform enforces run-as-non-root, so nginx
# runs as USER 1000 on the unprivileged port 8080 with all writable state
# (pid, temp, logs) redirected. write-env.sh (the CMD wrapper) writes the
# VITE_* secret-set vars into env.js before nginx starts, so the html
# directory must be writable by the app user.
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
RUN chown -R 1000:1000 /usr/share/nginx/html
COPY nginx-env.sh /usr/local/bin/write-env.sh
# chmod via RUN, not COPY --chmod — kaniko may not apply the flag.
RUN chmod 755 /usr/local/bin/write-env.sh
COPY nginx.conf /etc/nginx/nginx.conf
COPY nginx-default.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
USER 1000
# ";" on purpose: nginx must start even if the env.js write fails — a
# missing config only breaks login, never the public pages.
CMD ["sh", "-c", "/usr/local/bin/write-env.sh; exec nginx -g 'daemon off;'"]
