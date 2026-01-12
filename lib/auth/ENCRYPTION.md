# Encryption Implementation Details

This document describes the encryption implementation for the ClickHouse monitoring application, specifically focusing on how host credentials and sensitive data are encrypted at rest.

## Overview

The application uses **AES-256-GCM** encryption to secure sensitive data stored in the database, including:

- ClickHouse host passwords
- API tokens
- Other credentials
- Personal access tokens

## Encryption Algorithm

### Algorithm: AES-256-GCM

- **Algorithm**: AES (Advanced Encryption Standard)
- **Key Size**: 256 bits (32 bytes)
- **Mode**: GCM (Galois/Counter Mode)
- **IV Size**: 12 bytes (recommended for GCM)
- **Tag Size**: 16 bytes

### Why AES-256-GCM?

1. **Industry Standard**: Widely adopted and vetted encryption algorithm
2. **Authenticated Encryption**: GCM mode provides both confidentiality and integrity
3. **Performance**: Hardware-accelerated on modern CPUs
4. **Nonce-based**: Provides semantic security

## Implementation

### Core Functions

The encryption system is implemented in `lib/db/encryption.ts`:

```typescript
import CryptoJS from 'crypto-js'

// Get encryption key
export function getEncryptionKey(): string

// Encrypt data
export function encryptData(data: string, key?: string): string

// Decrypt data
export function decryptData(encryptedData: string, key?: string): string

// Specialized functions
export function encryptHostPassword(password: string, key?: string): string
export function decryptHostPassword(encryptedPassword: string, key?: string): string
```

### Example Usage

```typescript
import { encryptHostPassword, decryptHostPassword } from '@/lib/db/encryption'

// Encrypt a password
const password = 'my-secure-password'
const encrypted = encryptHostPassword(password)
// Returns: 'U2FsdGVkX1+...' (base64 encoded)

// Decrypt
const decrypted = decryptHostPassword(encrypted)
// Returns: 'my-secure-password'
```

## Key Management

### Key Generation

```typescript
const newKey = CryptoJS.lib.WordArray.random(32).toString()
```

### Key Storage

#### Development (Not Recommended for Production)

```typescript
// Stored in localStorage (browser)
localStorage.setItem('CHMONITOR_ENCRYPTION_KEY_1', newKey)
```

#### Production

**Environment Variable:**
```bash
CLICKHOUSE_ENCRYPTION_KEY=your-32-character-secret-key
```

**Cloud KMS:**
- AWS KMS
- Google Cloud KMS
- Azure Key Vault
- HashiCorp Vault

### Key Rotation

1. **Versioning**: `encryptionKeyVersion` field tracks the key version
2. **Migration**: Maintain ability to decrypt with old keys
3. **Re-encryption**: Periodically re-encrypt data with new keys

## Database Schema

### Encrypted Fields

```typescript
export const hosts = sqliteTable('hosts', {
  // ... other fields
  encryptedPassword: blob('encrypted_password'),
  encryptionKeyVersion: integer('encryption_key_version').default(1),
  // ... other fields
})
```

### Storage Format

The encrypted data is stored in Base64 format:

```
U2FsdGVkX1+ABC...XYZ=
```

This includes:
- The salt
- Initialization Vector (IV)
- Encrypted data
- Authentication tag

## Security Considerations

### 1. Key Storage Security

❌ **Don't**:
- Hardcode keys in source code
- Store in version control
- Use in client-side code
- Commit to Git

✅ **Do**:
- Use environment variables
- Use secrets management services
- Rotate keys regularly
- Audit key access

### 2. Database Security

The database itself must be secured:

```bash
# PostgreSQL
# Enable SSL connections
ssl = on
ssl_cert_file = '/etc/ssl/certs/server.crt'
ssl_key_file = '/etc/ssl/private/server.key'

# File permissions
chmod 600 sqlite.db
```

### 3. Application Security

- **HTTPS**: Always use TLS for connections
- **Session security**: Secure session cookies
- **API security**: Rate limiting, CORS policies
- **Audit logging**: Track all encryption operations

### 4. Access Control

```typescript
// Server-side only encryption
export function encryptServerOnly(data: string): string {
  if (typeof window !== 'undefined') {
    throw new Error('Encryption should only happen server-side')
  }
  return encryptData(data)
}
```

## Encryption Flow

### Host Password Storage

1. **Input**: User provides plaintext password
2. **Validation**: Validate password format
3. **Encryption**: Encrypt with current key
4. **Storage**: Store encrypted value and version
5. **Audit**: Log encryption event

```
User Input → Validation → Encryption → Storage → Audit
```

### Host Password Retrieval

1. **Fetch**: Retrieve encrypted password and version
2. **Key Selection**: Select appropriate decryption key
3. **Decryption**: Decrypt using AES-256-GCM
4. **Validation**: Verify integrity
5. **Usage**: Use in ClickHouse connection

```
Database → Encrypted Data → Key Selection → Decryption → Validation
```

## Performance

### Benchmark

```typescript
const data = 'sensitive-password'

console.time('Encrypt')
const encrypted = encryptData(data)
console.timeEnd('Encrypt') // ~2-5ms

console.time('Decrypt')
const decrypted = decryptData(encrypted)
console.timeEnd('Decrypt') // ~2-5ms
```

### Optimization

1. **Connection pooling**: Reuse ClickHouse connections
2. **Batch operations**: Process multiple encryptions at once
3. **Caching**: Cache decrypted data temporarily for active sessions

## Troubleshooting

### Common Issues

1. **Wrong Key**: "Authentication failed" or empty decrypted data
   - Verify `CLICKHOUSE_ENCRYPTION_KEY` matches
   - Check key version consistency

2. **Data Corruption**: "Malformed ciphertext"
   - Ensure data wasn't truncated
   - Check encoding (UTF-8)

3. **Performance**: Slow encryption/decryption
   - Check system entropy
   - Consider hardware acceleration

### Debug Mode

```typescript
// Temporarily log for debugging
const encrypted = encryptData(data)
console.log('Encrypted:', encrypted)
console.log('Version:', process.env.ENCRYPTION_KEY_VERSION)

const decrypted = decryptData(encrypted)
console.log('Decrypted:', decrypted)
```

## Migration Between Keys

### Scenario: Compromised Key

1. **Generate new key**
2. **Update environment variable**
3. **Migration script**:
```typescript
async function migrateKeys() {
  const hosts = await db.select().from(schema.hosts)

  for (const host of hosts) {
    // Decrypt with old key
    const password = decryptHostPassword(host.encryptedPassword, oldKey)

    // Encrypt with new key
    const encrypted = encryptHostPassword(password, newKey)

    // Update record
    await db
      .update(schema.hosts)
      .set({
        encryptedPassword: encrypted,
        encryptionKeyVersion: 2,
      })
      .where(eq(schema.hosts.id, host.id))
  }
}
```

4. **Monitor and verify** all records migrated
5. **Remove old key** after validation
6. **Archive** old key securely

## Compliance

### Standards Supported

- **NIST SP 800-38A**: Block Cipher Modes of Operation
- **FIPS 197**: Advanced Encryption Standard
- **ISO/IEC 19790**: Security requirements for cryptographic modules

### Audit Logging

All encryption operations are logged:

```typescript
await auditLogger.logAction({
  action: 'password_encryption',
  metadata: {
    version: encryptionKeyVersion,
    hostId: host.id,
  },
  status: 'success',
})
```

## Testing

### Unit Tests

```typescript
describe('Encryption', () => {
  it('should encrypt and decrypt correctly', () => {
    const data = 'test-password'
    const encrypted = encryptData(data)
    const decrypted = decryptData(encrypted)
    expect(decrypted).toBe(data)
  })

  it('should fail with wrong key', () => {
    const encrypted = encryptData('test', 'correct-key')
    expect(() => decryptData(encrypted, 'wrong-key')).toThrow()
  })
})
```

### Integration Tests

- Test with different encryption keys
- Test key version compatibility
- Test error handling and edge cases
- Performance benchmarks

## Future Enhancements

### Planned Features

1. **KMS Integration**: Cloud provider key management
2. **Key Rotation**: Automated rotation policies
3. **HSM Support**: Hardware security modules
4. **Per-Host Keys**: Unique keys per host
5. **Backup Encryption**: Encrypt database backups

### Security Improvements

1. **Memory Protection**: Secure memory for key storage
2. **Timing Attack Resistance**: Constant-time operations
3. **Hardware Acceleration**: AES-NI instructions
4. **Tamper Detection**: Store checksums with encrypted data

## References

- [CryptoJS Documentation](https://cryptojs.gitbook.io/docs/)
- [AES-GCM Security](https://en.wikipedia.org/wiki/Galois/Counter_Mode)
- [OWASP Encryption Guidelines](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [NIST Encryption Standards](https://csrc.nist.gov/projects/cryptographic-standards-and-guidelines)