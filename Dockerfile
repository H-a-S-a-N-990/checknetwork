FROM node:16

# Install system dependencies
RUN apt-get update && apt-get install -y iputils-ping iperf

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json .
RUN npm install

# Copy the application code
COPY . .

# Expose the port
EXPOSE 5000

# Run the application
CMD ["node", "index.js"]
