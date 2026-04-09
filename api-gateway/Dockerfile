FROM node:20-alpine

WORKDIR /usr/src/app

COPY package.json package-lock.json* ./ 

RUN npm install --production || npm install --omit=dev

COPY . .

EXPOSE 5000

CMD ["npm", "start"]