# ------- Base stage -------
FROM node:21.6 AS base
WORKDIR /app
COPY package.json package-lock.json* ./

# ------- Dev stage -------
FROM base AS dev
RUN npm install
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
