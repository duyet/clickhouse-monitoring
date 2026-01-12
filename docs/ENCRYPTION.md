# Encryption Implementation

This document describes the encryption implementation in the ClickHouse monitoring dashboard.

## Overview

The application uses AES-256-GCM encryption to protect sensitive data stored in the database, primarily ClickHouse host credentials.

## Encryption Details

### Algorithm
- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Length**: 256 bits (32 bytes)
- **IV Length**: 16 bytes
- **Authentication Tag**: 16 bytes

### Key Derivation
The encryption key is derived from the provided `ENCRYPTION_KEY` environment variable using PBKDF2 with:
- **Iterations**: 1 (for performance, using direct scrypt)
- **Salt**: Fixed "salt" (for development, should be randomized in production)
- **Output**: 32-byte key

## Security Features

### 1. Data Confidentiality
- All sensitive credentials are encrypted at rest
- Encryption uses industry-standard AES-256-GCM
- Each encryption operation uses a unique IV

### 2. Data Integrity
- GCM mode provides built-in integrity verification
- Authentication tags ensure encrypted data hasn't been tampered with

### 3. Key Management
- Encryption key is stored in environment variables
- Keys should be rotated periodically in production
- Never commit encryption keys to version control

## Implementation

### Encryption Process

```typescript
// 1. Derive key from environment
const key = scryptSync(encryptionKey, 'salt', 32)

// 2. Generate random IV
const iv = randomBytes(16)

// 3. Create cipher
const cipher = createCipheriv('aes-256-gcm', key, iv)

// 4. Encrypt data
let encrypted = cipher.update(text, 'utf8', 'hex')
encrypted += cipher.final('hex')

// 5. Get authentication tag
const tag = cipher.getAuthTag()

// 6. Store all components
return { encrypted, iv: iv.toString('hex'), tag: tag.toString('hex') }
```

### Decryption Process

```typescript
// 1. Derive key
const key = scryptSync(encryptionKey, 'salt', 32)

// 2. Create decipher
const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'))

// 3. Set authentication tag
decipher.setAuthTag(Buffer.from(tag, 'hex'))

// 4. Decrypt data
let decrypted = decipher.update(encrypted, 'hex', 'utf8')
decrypted += decipher.final('utf8')

// 5. Return plaintext
return decrypted
```

## Usage

### Encrypting Credentials

```typescript
import { encryptCredentials } from '@/lib/encryption'

const credentials = {
  username: 'admin',
  password: 'secret123'
}

const encrypted = encryptCredentials(credentials, process.env.ENCRYPTION_KEY!)
```

### Decrypting Credentials

```typescript
import { decryptCredentials } from '@/lib/encryption'

const decrypted = decryptCredentials(encryptedString, process.env.ENCRYPTION_KEY!)
// Returns: { username: 'admin', password: 'secret123' }
```

## Security Best Practices

### 1. Key Management
- Store encryption keys in environment variables
- Use a secrets management system in production
- Rotate keys regularly
- Never hardcode keys in source code

### 2. Environment Variables
```env
ENCRYPTION_KEY=your-32-character-encryption-key-here
```

### 3. Production Considerations
- Use a proper key derivation function with random salts
- Implement key rotation strategy
- Consider using a hardware security module (HSM)
- Audit access to encryption keys

### 4. Error Handling
- Gracefully handle decryption failures
- Log errors without exposing sensitive data
- Provide meaningful error messages to users

## Testing Encryption

### Unit Tests

```bash
bun test encryption.test.ts
```

### Integration Tests

1. Encrypt some test data
2. Verify it can be decrypted correctly
3. Test with different encryption keys
4. Verify tampered data fails decryption

## Performance Considerations

- Encryption/decryption is performed synchronously
- Keep encrypted data volumes reasonable
- Consider caching frequently accessed decrypted data
- Monitor performance in production

## Troubleshooting

### Common Issues

1. **Decryption Failures**
   - Verify correct encryption key
   - Check data integrity
   - Validate IV and tag formats

2. **Key Rotation**
   - Decrypt old data with old key
   - Re-encrypt with new key
   - Update all stored values

3. **Memory Issues**
   - For large datasets, consider streaming encryption
   - Monitor memory usage during operations

## Future Enhancements

1. **Key Derivation**: Use proper PBKDF2 with random salts
2. **Hardware Security**: Support for HSM integration
3. **Multi-factor Encryption**: Multiple layers of encryption
4. **Key Escrow**: Secure backup mechanisms for encryption keys