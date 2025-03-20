FROM node:18-alpine as build

# Set working directory
WORKDIR /app

# Copy package.json files
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies
RUN npm run install-all

# Copy source code
COPY . .

# Build client
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy server
COPY --from=build /app/server ./server
COPY --from=build /app/client/build ./client/build

# Set environment variable
ENV NODE_ENV=production

# Expose port
EXPOSE 5001

# Start server
CMD ["node", "server/server.js"] 