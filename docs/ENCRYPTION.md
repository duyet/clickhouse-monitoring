# Encryption Implementation

This document details the encryption implementation used in the ClickHouse monitoring application.

## Overview

The application uses AES-256-GCM encryption to protect sensitive data, specifically ClickHouse host credentials. All encryption operations are performed client-side before storage and decrypted on-demand when needed.

## Encryption Details

### Algorithm

- **Algorithm:** AES-256-GCM (Galois/Counter Mode)
- **Key Size:** 256 bits (32 bytes)
- **IV Size:** 128 bits (16 bytes)
- **Authentication Tag:** 128 bits (16 bytes)

### Key Management

The encryption key is stored in the `ENCRYPTION_KEY` environment variable.

#### Requirements

- **Length:** Minimum 64 characters (32 bytes)
- **Format:** Hexadecimal string
- **Generation:** Must be cryptographically secure

#### Key Generation

```bash
# Generate a secure encryption key
openssl rand -hex 32
```

#### Key Rotation

To rotate the encryption key:

1. Generate a new key:
```bash
NEW_KEY=$(openssl rand -hex 32)
```

2. Update environment:
```env
ENCRYPTION_KEY=$NEW_KEY
```

3. Re-encrypt all existing data:
   - Export all encrypted host data
   - Decrypt with old key
   - Encrypt with new key
   - Update database

**Note:** Key rotation requires application restart and data migration.

## Implementation

### Encryption Process

1. **Generate IV:** Create a random 16-byte initialization vector
2. **Create Cipher:** Initialize AES-256-GCM cipher with the encryption key
3. **Encrypt Data:** Process the data through the cipher
4. **Get Auth Tag:** Retrieve the authentication tag
5. **Store Components:** Save the encrypted data, IV, and auth tag

### Decryption Process

1. **Retrieve Components:** Get encrypted data, IV, and auth tag from storage
2. **Create Decipher:** Initialize AES-256-GCM decipher with the encryption key
3. **Set Auth Tag:** Configure the decipher with the authentication tag
4. **Decrypt Data:** Process the encrypted data through the decipher
5. **Return Result:** Return the decrypted plaintext

### Security Features

#### Authentication

- GCM mode provides built-in authentication
- Each encrypted message has a unique authentication tag
- Tampering with encrypted data will be detected during decryption

#### Forward Secrecy

- Each encryption operation uses a unique IV
- Two identical messages will produce different ciphertexts
- IVs are never reused

#### Data Integrity

- Authentication tags ensure data integrity
- Any modification of encrypted data will cause decryption to fail

## Usage

### Encrypting Host Credentials

```typescript
import { encryptHostCredentials } from "@/lib/encryption"

const credentials = {
  host: "localhost",
  port: 9000,
  username: "default",
  password: "secret",
  database: "default"
}

const { encrypted, iv, tag } = encryptHostCredentials(credentials)
```

### Decrypting Host Credentials

```typescript
import { decryptHostCredentials } from "@/lib/encryption"

const credentials = decryptHostCredentials(encrypted, iv, tag)
// {
//   host: "localhost",
//   port: 9000,
//   username: "default",
//   password: "secret",
//   database: "default"
// }
```

### Password Hashing

User passwords are hashed using bcrypt with a work factor of 12:

```typescript
import { hashPassword, verifyPassword } from "@/lib/encryption"

// Hash password
const hashed = await hashPassword("password123")

// Verify password
const isValid = await verifyPassword("password123", hashed)
```

## Storage Format

Encrypted data is stored in the `hosts` table with the following structure:

```sql
CREATE TABLE hosts (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  host TEXT NOT NULL,
  port INTEGER NOT NULL,
  username TEXT NOT NULL,
  password TEXT NOT NULL,  -- Encrypted data
  database TEXT DEFAULT 'default',
  custom_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

The password field contains:
- The encrypted data (hex string)
- The IV (hex string)
- The authentication tag (hex string)

All three components are concatenated and stored as a single string.

## Security Best Practices

### Environment Variables

- Never commit encryption keys to version control
- Use environment-specific keys for different deployments
- Store keys securely in production (e.g., HashiCorp Vault, AWS Secrets Manager)

### Key Storage

- Use hardware security modules (HSMs) for production environments
- Consider using key management services (KMS) for cloud deployments
- Regularly audit key access and usage

### Data Protection

- Implement proper access controls for encrypted data
- Use least privilege principle for database access
- Regularly audit who can access sensitive data

### Monitoring

- Monitor encryption key usage
- Log encryption/decryption operations (without logging keys or data)
- Set up alerts for unusual encryption activity

## Compliance

### GDPR

- Encryption helps meet GDPR requirements for data protection
- Consider implementing data residency requirements
- Ensure right to erasure by properly deleting encrypted data

### SOC 2

- Encryption is a key control for SOC 2 compliance
- Document encryption policies and procedures
- Regularly test encryption controls

## Troubleshooting

### Common Issues

1. **Decryption fails**
   - Verify encryption key is correct
   - Check data integrity (authentication tag)
   - Ensure IV format is correct

2. **Key too short**
   - Verify ENCRYPTION_KEY is at least 64 characters
   - Check for trailing whitespace
   - Use proper hex encoding

3. **Performance issues**
   - Consider caching decrypted credentials in memory
   - Use connection pooling for database operations
   - Optimize encryption/decryption frequency

### Debug Mode

Enable debug logging to troubleshoot encryption issues:

```typescript
// In encryption.ts
if (process.env.NODE_ENV === "development") {
  console.log("Encrypting data:", data)
  console.log("IV:", iv)
  console.log("Tag:", tag)
}
```

**Warning:** Debug logging should never be enabled in production as it may expose sensitive information.