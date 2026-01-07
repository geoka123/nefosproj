FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source files (will be overridden by volume mount in dev, but needed for initial build)
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Run dev server with hot reload
# Host 0.0.0.0 allows external connections (required for Docker)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

