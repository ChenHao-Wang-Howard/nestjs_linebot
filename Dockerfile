
FROM node:20.13.0


WORKDIR /app


COPY package*.json ./

RUN yarn install


COPY . .


RUN yarn build


#RUN npx prisma migrate dev
RUN npx prisma generate


EXPOSE 3333


CMD ["yarn", "start:dev"]