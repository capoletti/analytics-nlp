FROM trinodb/trino:latest
COPY etc /etc/trino
COPY run-with-secrets.sh /usr/lib/trino/bin/run-with-secrets.sh
CMD ["/bin/sh", "/usr/lib/trino/bin/run-with-secrets.sh"]
