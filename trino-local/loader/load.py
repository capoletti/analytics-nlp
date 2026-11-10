import time
import os
from trino.auth import BasicAuthentication
from trino.dbapi import connect

TRINO_HOST = os.environ.get("TRINO_HOST", "trino")
TRINO_PORT = int(os.environ.get("TRINO_PORT", "8443"))
TRINO_USER = os.environ.get("TRINO_USER", "loader")
TRINO_PASSWORD_FILE = os.environ.get("TRINO_PASSWORD_FILE", "/run/secrets/trino-loader/loader")
TRINO_CA_CERT_PATH = os.environ.get("TRINO_CA_CERT_PATH", "/run/secrets/trino-ca/ca.crt")

SQL_FILES = [
    "/app/sql/create_tables.sql",
    "/app/sql/insert_data.sql"
]


def get_connection():
    with open(TRINO_PASSWORD_FILE, "r", encoding="utf-8") as f:
        password = f.read().strip()
    return connect(
        host=TRINO_HOST,
        port=TRINO_PORT,
        user=TRINO_USER,
        auth=BasicAuthentication(TRINO_USER, password),
        http_scheme="https",
        verify=TRINO_CA_CERT_PATH,
    )


def wait_for_trino(max_wait=120):
    start = time.time()
    while time.time() - start < max_wait:
        try:
            conn = get_connection()
            cur = conn.cursor()
            cur.execute("SELECT 1")
            cur.fetchall()
            # ensure iceberg catalog exists
            cur.execute("SHOW CATALOGS")
            catalogs = [row[0] for row in cur.fetchall()]
            if "iceberg" in catalogs:
                return True
        except Exception:
            pass
        time.sleep(3)
    return False


def run_sql_file(path):
    with open(path, "r", encoding="utf-8") as f:
        sql = f.read()
    conn = get_connection()
    cur = conn.cursor()
    for statement in [s.strip() for s in sql.split(";\n") if s.strip()]:
        print(f"Executing SQL: {statement[:200]}...")
        cur.execute(statement)
        # consume results for DDL/DML
        try:
            cur.fetchall()
        except Exception:
            pass


if __name__ == "__main__":
    if not wait_for_trino():
        raise SystemExit("Trino not ready or iceberg catalog unavailable.")
    for path in SQL_FILES:
        run_sql_file(path)
    print("Seed complete.")
