FROM node:18.18.2-alpine
WORKDIR /app

# Copy manifests first to use layer cache effectively
COPY package.json package-lock.json ./

# Install dependencies with scripts enabled
ENV NPM_CONFIG_FUND=false NPM_CONFIG_AUDIT=false
RUN npm ci

# Copy the rest of the code
COPY . .

# Build TypeScript
RUN npm run build

EXPOSE 8080
CMD ["node", "dist/index.js"]
