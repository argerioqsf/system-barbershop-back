FROM node:20.11.0

ARG PORT

COPY prisma ./prisma/

RUN npm install -g npm@10.4.0 \ 
    npm install -g tsc \
    npm install -g tsx \
    npm install -g concurrently \
    npm install -g typescript \
    npx prisma generate

ENV INSTALL_PATH /opt/app
RUN mkdir -p $INSTALL_PATH

WORKDIR $INSTALL_PATH
COPY . .
RUN rm -rf node_modules

COPY entrypoint.sh /usr/bin/
RUN chmod +x /usr/bin/entrypoint.sh
ENTRYPOINT ["entrypoint.sh"]
EXPOSE $PORT

CMD ["npm", "run", "dev"]