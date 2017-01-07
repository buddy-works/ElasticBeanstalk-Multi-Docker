FROM node:5.11.0

WORKDIR /code
COPY . /code

RUN npm install

CMD ["node", "app.js"]
