"""Generate a scrypt hash for TENANT_PASSWORD_HASHES.

Usage: python scripts/hash_password.py  (prompts for the password)
"""

import getpass
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.infrastructure.security.passwords import hash_password  # noqa: E402

if __name__ == "__main__":
    password = getpass.getpass("Password: ")
    if password != getpass.getpass("Confirm: "):
        sys.exit("Passwords do not match")
    print(hash_password(password))
