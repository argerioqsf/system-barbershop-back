FROM node:20

ARG PORT

RUN npm install -g npm@10.4.0 \ 
    npm install -g tsc \
    npm install -g tsx \
    npm install -g concurrently \
    npm install -g typescript 

ENV INSTALL_PATH /opt/app
RUN mkdir -p $INSTALL_PATH

WORKDIR $INSTALL_PATH
COPY . .
RUN rm -rf node_modules

COPY entrypoint.sh /usr/bin/
RUN chmod +x /usr/bin/entrypoint.sh
ENTRYPOINT ["entrypoint.sh"]
EXPOSE $PORT

USER $USER_ID

CMD ["npm", "run", "dev"]