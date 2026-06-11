FROM node:24-alpine

WORKDIR /app

# Dependências nativas (argon2 precisa de build tools)
RUN apk add --no-cache python3 make g++

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
