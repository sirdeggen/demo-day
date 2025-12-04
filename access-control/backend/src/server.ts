import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { createAuthMiddleware } from '@bsv/auth-express-middleware';
import { getWallet } from './wallet';
import { Utils } from '@bsv/sdk';

dotenv.config();

const PORT = process.env.PORT || 3002;
const CERTIFIER_PUBLIC_KEY = '03c644fe2fd97673a5d86555a58587e7936390be6582ece262bc387014bcff6fe4';

// Extended Request type to include certificates
interface AuthenticatedRequest extends Request {
  certificates?: any[];
  senderPublicKey?: string;
}

async function startServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Get wallet instance
  const wallet = await getWallet();

  // Certificate type (base64 encoded "age-verification")
  const certificateType = Utils.toBase64(Utils.toArray('age-verification', 'utf8'));

  // Certificate validation callback
  function onCertificatesReceived(
    senderPublicKey: string,
    certs: any[],
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    console.log(`Received certificates from ${senderPublicKey}:`, certs);

    // Store certificates and sender in request for route handlers
    req.certificates = certs;
    req.senderPublicKey = senderPublicKey;

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
  app.get('/api/protected/video', (req: AuthenticatedRequest, res: Response) => {
    try {
      // Validate certificates
      if (!req.certificates || req.certificates.length === 0) {
        return res.status(403).json({ error: 'No certificates provided' });
      }

      const cert = req.certificates[0];

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
