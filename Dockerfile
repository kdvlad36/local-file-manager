FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY server.js ./

# Создаем директорию для файлов
RUN mkdir -p /data/file_transfer

# Устанавливаем переменную окружения для директории файлов
ENV FILE_TRANSFER_DIR=/data/file_transfer

EXPOSE 3001

CMD ["node", "server.js"] 