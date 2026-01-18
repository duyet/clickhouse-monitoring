# Password Encryption for ClickHouse Hosts

This module provides AES-256-GCM authenticated encryption for storing ClickHouse passwords securely at rest.

## Features

- **AES-256-GCM**: Industry-standard authenticated encryption
- **Key Derivation**: Uses scrypt to derive encryption keys from `AUTH_SECRET`
- **Random IV**: Each encryption uses a unique initialization vector
- **Authentication Tag**: Detects data corruption and tampering
- **TypeScript**: Full type safety with comprehensive error handling

## Usage

### Setup

Set the `AUTH_SECRET` environment variable:

```bash
# .env.local
AUTH_SECRET="your-secure-random-secret-key-here"
```

Generate a secure secret:

```bash
# Using Node.js crypto
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Encrypting Passwords

```typescript
import { encryptPassword, isEncryptionAvailable } from '@/lib/auth/encryption'

// Check if encryption is available
if (!isEncryptionAvailable()) {
  throw new Error('AUTH_SECRET is not set')
}

// Encrypt a password
const encrypted = await encryptPassword('my-secure-password')
// Returns: base64-encoded string (e.g., "bXlzZWN1cmVwYXNzd29yZA==")
```

### Decrypting Passwords

```typescript
import { decryptPassword } from '@/lib/auth/encryption'

// Decrypt a password
const password = await decryptPassword(encrypted)
// Returns: "my-secure-password"
```

### Error Handling

```typescript
import { EncryptionError } from '@/lib/auth/encryption'

try {
  const encrypted = await encryptPassword('password')
} catch (error) {
  if (error instanceof EncryptionError) {
    console.error('Encryption failed:', error.message)
  }
}
```

## API Reference

### `isEncryptionAvailable(): boolean`

Check if encryption is available (AUTH_SECRET is set).

**Returns:** `true` if `AUTH_SECRET` is set, `false` otherwise

### `encryptPassword(password: string): Promise<string>`

Encrypt a password using AES-256-GCM.

**Parameters:**
- `password` - Plain text password to encrypt

**Returns:** Base64-encoded string in format: `iv + tag + encrypted`

**Throws:** `EncryptionError` if `AUTH_SECRET` is not set or encryption fails

### `decryptPassword(encrypted: string): Promise<string>`

Decrypt a password using AES-256-GCM.

**Parameters:**
- `encrypted` - Base64-encoded encrypted string

**Returns:** Decrypted plain text password

**Throws:** `EncryptionError` if `AUTH_SECRET` is not set, decryption fails, or data is corrupted

## Security Considerations

### Key Management

- Store `AUTH_SECRET` securely in environment variables
- Never commit `AUTH_SECRET` to version control
- Use different secrets for different environments (dev, staging, production)
- Rotate secrets periodically

### Encryption Format

The encrypted output is a base64-encoded concatenation of:

1. **IV (16 bytes)**: Random initialization vector
2. **Auth Tag (16 bytes)**: Authentication tag for data integrity
3. **Ciphertext (variable)**: Encrypted password data

Total size: ~1.37x original password length (base64-encoded)

### Key Derivation

- Uses scrypt with fixed salt `"clickhouse-monitor-salt"`
- 32-byte key length for AES-256
- Derived synchronously from `AUTH_SECRET`

### Migration from XOR Encryption

The old XOR-based encryption in `lib/db/utils.ts` is deprecated:

```typescript
// ❌ Old (deprecated, insecure)
import { encryptPassword } from '@/lib/db/utils'

// ✅ New (secure AES-256-GCM)
import { encryptPassword } from '@/lib/auth/encryption'
```

## Testing

Run tests:

```bash
bun test lib/auth/__tests__/encryption.test.ts
```

The test suite covers:
- Basic encryption/decryption
- Empty strings and special characters
- Unicode support
- Error handling (missing AUTH_SECRET, corrupted data)
- Different secrets produce different results
- Authentication tag verification

## Implementation Details

### Algorithm: AES-256-GCM

- **Cipher**: AES (Advanced Encryption Standard)
- **Key Size**: 256 bits
- **Mode**: GCM (Galois/Counter Mode)
- **IV Size**: 16 bytes (128 bits)
- **Auth Tag Size**: 16 bytes (128 bits)

### Why AES-256-GCM?

1. **Authenticated Encryption**: Provides both confidentiality and integrity
2. **Industry Standard**: Widely adopted and well-vetted
3. **Performance**: Hardware acceleration available on modern CPUs
4. **Security**: No known practical attacks when used correctly

### Key Derivation: scrypt

- **Algorithm**: scrypt (memory-hard KDF)
- **Salt**: Fixed `"clickhouse-monitor-salt"`
- **Output**: 32 bytes (256 bits) for AES-256

## License

See project LICENSE file.
