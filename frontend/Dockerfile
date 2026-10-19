# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Stage 1: build
# ---------------------------------------------------------------------------
FROM node:20-alpine AS build
WORKDIR /app

# Install pnpm pinned to the version defined in package.json
RUN npm install -g pnpm@12.11.2

# Copy package manifests for optimal layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Copy frontend source and build static bundle
COPY . .
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN pnpm build

# ---------------------------------------------------------------------------
# Stage 2: final (nginx:alpine)
# ---------------------------------------------------------------------------
FROM nginx:alpine AS final
WORKDIR /usr/share/nginx/html

# Clean default nginx assets and copy compiled static assets
RUN rm -rf ./*
COPY --from=build /app/dist .

# Copy hardened nginx server block configuration
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
