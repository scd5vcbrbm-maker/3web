/**
 * Security Configuration
 * AES-256, ECDSA, GSM encryption
 */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');

class SecurityManager {
  constructor() {
    this.masterKeySecret = process.env.MASTER_KEY_SECRET;
    this.encryptionAlgorithm = 'aes-256-gcm';
    this.iterations = 100000;
    this.tagLength = 16;
  }

  /**
   * Generate Master Key for AES-256 encryption
   */
  generateMasterKey() {
    const key = crypto.randomBytes(32);
    return key.toString('hex');
  }

  /**
   * Derive key from password using PBKDF2
   */
  deriveKey(password, salt = null) {
    if (!salt) {
      salt = crypto.randomBytes(32);
    }

    const derivedKey = crypto.pbkdf2Sync(
      password,
      salt,
      this.iterations,
      32,
      'sha256'
    );

    return {
      key: derivedKey,
      salt: salt.toString('hex')
    };
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  encryptAES256(plaintext, masterKey) {
    try {
      const iv = crypto.randomBytes(12);
      const key = Buffer.from(masterKey, 'hex');

      const cipher = crypto.createCipheriv(this.encryptionAlgorithm, key, iv);
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      return {
        iv: iv.toString('hex'),
        encryptedData: encrypted,
        authTag: authTag.toString('hex'),
        algorithm: this.encryptionAlgorithm
      };
    } catch (err) {
      throw new Error(`AES-256 encryption failed: ${err.message}`);
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  decryptAES256(encryptedObject, masterKey) {
    try {
      const key = Buffer.from(masterKey, 'hex');
      const iv = Buffer.from(encryptedObject.iv, 'hex');
      const authTag = Buffer.from(encryptedObject.authTag, 'hex');
      const encryptedData = encryptedObject.encryptedData;

      const decipher = crypto.createDecipheriv(this.encryptionAlgorithm, key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (err) {
      throw new Error(`AES-256 decryption failed: ${err.message}`);
    }
  }

  /**
   * Generate ECDSA key pair
   */
  generateECDSAKeyPair() {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
      namedCurve: 'secp256k1',
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });

    return {
      privateKey,
      publicKey
    };
  }

  /**
   * Sign data with ECDSA
   */
  signWithECDSA(data, privateKey) {
    try {
      const sign = crypto.createSign('SHA256');
      sign.update(data);
      const signature = sign.sign(privateKey, 'hex');
      return signature;
    } catch (err) {
      throw new Error(`ECDSA signing failed: ${err.message}`);
    }
  }

  /**
   * Verify ECDSA signature
   */
  verifyECDSA(data, signature, publicKey) {
    try {
      const verify = crypto.createVerify('SHA256');
      verify.update(data);
      return verify.verify(publicKey, signature, 'hex');
    } catch (err) {
      throw new Error(`ECDSA verification failed: ${err.message}`);
    }
  }

  /**
   * Hash password with bcrypt
   */
  async hashPassword(password) {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  }

  /**
   * Compare password with hash
   */
  async comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate secure random token
   */
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hash data with SHA-256
   */
  hashSHA256(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

module.exports = new SecurityManager();
