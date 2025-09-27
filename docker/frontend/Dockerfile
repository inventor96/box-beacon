# ------- Base stage -------
FROM node:21.6 AS base
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

# ------- Dev stage -------
FROM base AS dev
COPY . .
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ------- Build stage -------
FROM base AS build
COPY . .
RUN npm run build

# ------- Prod stage -------
FROM nginx:stable-alpine AS prod
COPY --from=build /app/dist /usr/share/nginx/html
