#!/bin/sh
# Gera (uma única vez) as credenciais do Trino em volumes Docker separados:
#   /secrets/server  -> password.db (bcrypt), trino.pem (chave + certificado TLS), shared-secret  [só Trino]
#   /secrets/ca      -> ca.crt usado pelos clientes para validar o TLS do Trino               [Trino, backend, loader]
#   /secrets/loader  -> senha do usuário "loader"                                                [só loader]
#   /secrets/backend -> senhas dos usuários user_<tenant>                                        [só backend]
set -eu

SERVER_DIR=/secrets/server
CA_DIR=/secrets/ca
LOADER_DIR=/secrets/loader
BACKEND_DIR=/secrets/backend
TENANTS="${TRINO_TENANTS:-empresa1 empresa2 empresa3}"

umask 077
mkdir -p "$SERVER_DIR" "$CA_DIR" "$LOADER_DIR" "$BACKEND_DIR"

ensure_password() {
  [ -s "$1" ] || openssl rand -hex 32 > "$1"
}

ensure_password "$LOADER_DIR/loader"
for tenant in $TENANTS; do
  ensure_password "$BACKEND_DIR/user_$tenant"
done

[ -s "$SERVER_DIR/shared-secret" ] || openssl rand -base64 48 | tr -d '\n' > "$SERVER_DIR/shared-secret"

add_user() {
  tr -d '\n' < "$2" | htpasswd -niB -C 10 "$1" | grep -v '^$' >> "$SERVER_DIR/password.db.tmp"
}

: > "$SERVER_DIR/password.db.tmp"
add_user loader "$LOADER_DIR/loader"
for tenant in $TENANTS; do
  add_user "user_$tenant" "$BACKEND_DIR/user_$tenant"
done
mv "$SERVER_DIR/password.db.tmp" "$SERVER_DIR/password.db"

if [ ! -s "$SERVER_DIR/trino.pem" ] || [ ! -s "$CA_DIR/ca.crt" ]; then
  work="$(mktemp -d)"
  openssl req -x509 -newkey rsa:3072 -nodes -days 825 \
    -subj "/CN=analytics-nlp Trino local CA" \
    -addext "basicConstraints=critical,CA:TRUE" \
    -addext "keyUsage=critical,keyCertSign,cRLSign" \
    -keyout "$work/ca.key" -out "$work/ca.crt" 2>/dev/null
  openssl req -newkey rsa:3072 -nodes -subj "/CN=trino" \
    -keyout "$work/server.key" -out "$work/server.csr" 2>/dev/null
  cat > "$work/server.ext" <<EXT
basicConstraints=CA:FALSE
keyUsage=critical,digitalSignature,keyEncipherment
extendedKeyUsage=serverAuth
subjectAltName=DNS:trino,DNS:localhost,IP:127.0.0.1
EXT
  openssl x509 -req -in "$work/server.csr" -CA "$work/ca.crt" -CAkey "$work/ca.key" \
    -CAcreateserial -days 825 -extfile "$work/server.ext" -out "$work/server.crt" 2>/dev/null
  cat "$work/server.key" "$work/server.crt" > "$SERVER_DIR/trino.pem"
  cp "$work/ca.crt" "$CA_DIR/ca.crt"
  chmod 644 "$CA_DIR/ca.crt"
  rm -rf "$work"
fi

echo "Trino secrets ready."
