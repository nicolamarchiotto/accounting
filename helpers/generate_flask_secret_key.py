import secrets

# Generate a secure random 24-byte key
secret_key = secrets.token_hex(24)  # Generates a 48-character hexadecimal string

print(secret_key)