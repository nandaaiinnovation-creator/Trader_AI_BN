FROM node:18.18.2-alpine
WORKDIR /app

# Copy only manifests first to leverage Docker layer caching
COPY package.json package-lock.json ./

# Install full dependencies (include dev deps for build) with scripts enabled
ENV NPM_CONFIG_FUND=false NPM_CONFIG_AUDIT=false
RUN npm ci

# Now copy the rest of the source
COPY . .

# Build production assets
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "preview"]
