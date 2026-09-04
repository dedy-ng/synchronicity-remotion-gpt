FROM node:22-bookworm

WORKDIR /app

RUN apt-get update && apt-get install -y \
    chromium \
    ffmpeg \
    fonts-liberation \
    libnss3 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libgbm1 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

ENV PORT=3001
ENV REMOTION_BROWSER_EXECUTABLE=/usr/bin/chromium
EXPOSE 3001

CMD ["npm", "start"]
