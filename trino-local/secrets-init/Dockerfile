FROM alpine:3.20
RUN apk add --no-cache openssl apache2-utils
COPY init.sh /usr/local/bin/init-trino-secrets.sh
RUN chmod 755 /usr/local/bin/init-trino-secrets.sh
CMD ["/usr/local/bin/init-trino-secrets.sh"]
