import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { createAuthMiddleware, AuthRequest } from '@bsv/auth-express-middleware';
import { getWallet } from './wallet';
import { Utils, VerifiableCertificate } from '@bsv/sdk';

dotenv.config();

const PORT = process.env.PORT || 3002;
const CERTIFIER_PUBLIC_KEY = '03c644fe2fd97673a5d86555a58587e7936390be6582ece262bc387014bcff6fe4';

const certificates: Record<string, any[]> = {};

async function startServer() {
  const app = express();

  // Middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', '*')
    res.header('Access-Control-Allow-Methods', '*')
    res.header('Access-Control-Expose-Headers', '*')
    res.header('Access-Control-Allow-Private-Network', 'true')
    if (req.method === 'OPTIONS') {
      // Handle CORS preflight requests to allow cross-origin POST/PUT requests
      res.sendStatus(200)
    } else {
      next()
    }
  })
  app.use(express.json());

  // Get wallet instance
  const wallet = await getWallet();

  // Certificate type (base64 encoded "age-verification")
  const certificateType = Utils.toBase64(Utils.toArray('age-verification', 'utf8'));

  // Certificate validation callback
  async function onCertificatesReceived(
    senderPublicKey: string,
    certs: any[],
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    console.log(`Received certificates from ${senderPublicKey}:`, certs);

    // Decrypt certificate fields
    try {
      for (const cert of certs) {
        if (cert.keyring && cert.fields && cert.certifier) {
          // Create a verifiable certificate for this verifier (server)
          const verifiableCert = VerifiableCertificate.fromCertificate(cert, cert.keyring);

          // Decrypt the fields using the verifiable certificate's keyring
          const decryptedFields = await verifiableCert.decryptFields(wallet);

          console.log('Decrypted certificate fields:', decryptedFields);

          // Replace encrypted fields with decrypted values
          cert.fields = decryptedFields;
        }
      }
    } catch (error) {
      console.error('Error decrypting certificate fields:', error);
    }

    // Store certificates and sender in request for route handlers
    if (!certificates[senderPublicKey]) {
      certificates[senderPublicKey] = [];
    }
    certificates[senderPublicKey].push(...certs);

    next();
  }

  // Create auth middleware
  const authMiddleware = createAuthMiddleware({
    wallet,
    certificatesToRequest: {
      certifiers: [CERTIFIER_PUBLIC_KEY],
      types: {
        [certificateType]: ['over18', 'timestamp']
      }
    },
    onCertificatesReceived
  });

  app.use(authMiddleware)

  // Protected routes (require auth & certificates)
  app.get('/api/protected/video', (req: AuthRequest, res: Response) => {
    try {
      const identityKey = req.auth?.identityKey as string;
      // Validate certificates
      if (!certificates[identityKey][0]) {
        return res.status(403).json({ error: 'No certificates provided' });
      }

      const cert = certificates[identityKey][0];

      // Check if certificate has required fields
      if (!cert.fields || !cert.fields.over18 || !cert.fields.timestamp) {
        return res.status(403).json({ error: 'Invalid certificate fields' });
      }

      // Validate over18 is true
      const over18 = cert.fields.over18;
      if (over18 !== 'true' && over18 !== true) {
        return res.status(403).json({ error: 'Access denied: Must be over 18' });
      }

      // Validate timestamp is within last 3 minutes
      const timestamp = parseInt(cert.fields.timestamp);
      const now = Math.floor(Date.now() / 1000);
      const age = now - timestamp;

      if (age > 180) {
        return res.status(403).json({
          error: 'Certificate expired',
          details: `Certificate is ${age} seconds old (max 180 seconds)`
        });
      }

      if (timestamp > now + 10) {
        return res.status(403).json({ error: 'Certificate timestamp is in the future' });
      }

      // All validations passed, return video URL
      res.json({
        success: true,
        videoUrl: '/video/2387368734-34-2354234-5432-4235.mp4',
        message: 'Access granted'
      });

    } catch (error) {
      console.error('Error validating certificate:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
