FROM node:20-alpine AS base

WORKDIR /app

# Copy package files
COPY package*.json ./

# Development stage
FROM base AS development

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy the rest of the application
COPY . .

EXPOSE 3000

# Use nodemon with polling for Docker volume changes
CMD ["npx", "nodemon", "--legacy-watch", "--watch", "src", "--ext", "ts,json", "--exec", "ts-node", "src/infrastructure/api/server.ts"]

# Production stage
FROM base AS production

RUN npm ci --omit=dev

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/infrastructure/api/server.js"]
