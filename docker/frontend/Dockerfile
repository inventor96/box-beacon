# Frontend Dockerfile

# Environment
FROM node:21.6
WORKDIR /app

# Install deps first (cached layer)
COPY package.json package-lock.json* ./
RUN npm install

# Copy everything (vite.config.ts, src/, etc.)
COPY . .

# Default command: vite dev server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
