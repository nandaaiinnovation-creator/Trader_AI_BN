FROM node:18.18.2-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
