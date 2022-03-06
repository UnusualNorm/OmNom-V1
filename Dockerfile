# STAGE 1
FROM node:17 as builder
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY package*.json ./

#TODO: figure out how to build zlib-sync in alpine (limits.h not found)
#RUN apk add git
#RUN apk add python3
#RUN apk add make
#RUN apk add gcc
#RUN apk add g++
#RUN apk add zlib

USER node
RUN yarn install
COPY --chown=node:node . .
RUN yarn build

# STAGE 2
FROM node:17
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY package*.json ./
USER node

#RUN npm install -g yarn
RUN yarn install --production
COPY --from=builder /home/node/app/dist ./dist

COPY --chown=node:node .env.defaults .

RUN touch json.sqlite
#VOLUME [ "/home/node/app/data" ]

#TODO: Research the expose command...
#EXPOSE 6969
CMD [ "yarn", "start" ]
