FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy app source
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5001

# Expose the port
EXPOSE 5001

# Start the application
CMD ["npm", "start"] 