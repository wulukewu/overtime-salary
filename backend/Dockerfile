FROM node:18-alpine

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    sqlite-dev \
    py3-setuptools

# Install npm dependencies and rebuild SQLite3
COPY package*.json ./
RUN npm install --build-from-source --sqlite=/usr/local

# Copy application code
COPY . .

# Set environment variables for reverse proxy
ENV NODE_ENV=production
ENV TRUST_PROXY=1
ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"] 