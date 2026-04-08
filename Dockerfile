FROM node:18

WORKDIR /app

COPY src/app.js .

EXPOSE 80

CMD ["node", "app.js"]