# Multi-stage: build CRA, then run Express + static build (same as Render-style monolith).
# Fly.io sets PORT to match fly.toml http_service.internal_port (8080).

FROM node:20-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ENV NODE_ENV=production
ENV CI=true
ENV DISABLE_ESLINT_PLUGIN=true
ENV GENERATE_SOURCEMAP=false
ENV REACT_APP_RUNTIME_ENV=live
# Same host serves SPA + /api — use relative /api/... in the browser (required on Fly; optional elsewhere).
ENV REACT_APP_API_RELATIVE=1

RUN npm run build

FROM node:20-bookworm-slim AS run
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/build ./build
COPY --from=build /app/backend ./backend
COPY --from=build /app/server.js ./server.js

EXPOSE 8080
CMD ["node", "server.js"]
