# Use official Node.js runtime as a parent image
FROM node:18-alpine

# Set working directory inside container
WORKDIR /usr/src/app

# Copy dependency specifications
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy remaining source code
COPY . .

# Expose port 3000 to the container network
EXPOSE 3000

# Define start command
CMD ["node", "server.js"]