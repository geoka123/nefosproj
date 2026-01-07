FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source files (will be overridden by volume mount in dev, but needed for initial build)
COPY . .

# Copy startup script
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Expose Vite dev server port
EXPOSE 5173

# Run startup script that verifies files exist before starting Vite
CMD ["/start.sh"]

