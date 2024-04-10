from node:20

WORKDIR /app
COPY package*.json /app/
run npm install --force

copy . /app/
EXPOSE 3000
CMD ["npm", "run", "start"]