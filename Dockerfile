FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# 🔥 INSTALL DOCKER INSIDE CONTAINER
RUN apt-get update && apt-get install -y docker.io

EXPOSE 3000

CMD ["npm", "start"]