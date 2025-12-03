import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWallet } from '@/context/WalletContext';
import { LockingScript, Transaction } from '@bsv/sdk';
import type { ApiResponse, Award } from '@/types';
import { AlertCircle, CheckCircle, Shield, ShieldAlert } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export function DataIntegrityDemo() {
  const { wallet, isInitialized } = useWallet();
  const [withoutBsvData, setWithoutBsvData] = useState<Award[]>([]);
  const [withBsvData, setWithBsvData] = useState<Award[]>([]);
  const [isLoadingWithout, setIsLoadingWithout] = useState(false);
  const [isLoadingWith, setIsLoadingWith] = useState(false);
  const [integrityProofCreated, setIntegrityProofCreated] = useState(false);
  const [validationResults, setValidationResults] = useState<{
    record3: boolean | null;
    record5: boolean | null;
  }>({ record3: null, record5: null });

  // Fetch data without BSV (shows altered data)
  const fetchDataWithoutBsv = async () => {
    setIsLoadingWithout(true);
    try {
      const response = await fetch(`${API_BASE_URL}/data/altered`);
      const data: ApiResponse = await response.json();
      setWithoutBsvData(data.results);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoadingWithout(false);
    }
  };

  // Fetch data with BSV (original data)
  const fetchDataWithBsv = async () => {
    setIsLoadingWith(true);
    try {
      const response = await fetch(`${API_BASE_URL}/data/original`);
      const data: ApiResponse = await response.json();
      setWithBsvData(data.results);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoadingWith(false);
    }
  };

  // Create integrity proofs for records 3 and 5
  const createIntegrityProofs = async () => {
    if (!wallet || !isInitialized) {
      alert('Wallet not initialized');
      return;
    }

    try {
      // Fetch the original records we want to protect
      const response = await fetch(`${API_BASE_URL}/data/records`);
      const records: Award[] = await response.json();

      // Create integrity proofs for each record
      for (const record of records) {
        const recordData = JSON.stringify(record);
        const dataHex = Buffer.from(recordData, 'utf8').toString('hex');

        // Create OP_FALSE OP_RETURN script with the data
        const lockingScript = LockingScript.fromASM(`OP_FALSE OP_RETURN ${dataHex}`);

        // Create action using WalletClient
        await wallet.createAction({
          outputs: [{
            lockingScript,
            satoshis: 0,
            basket: 'integrity'
          }],
          description: `Data integrity proof for award ${record['Award ID']}`
        });
      }

      setIntegrityProofCreated(true);
      alert('Integrity proofs created successfully!');
    } catch (error) {
      console.error('Error creating integrity proofs:', error);
      alert('Failed to create integrity proofs. See console for details.');
    }
  };

  // Validate data integrity using BSV
  const validateDataIntegrity = async () => {
    if (!wallet || !isInitialized) {
      alert('Wallet not initialized');
      return;
    }

    try {
      // List outputs with integrity basket
      const outputs = await wallet.listOutputs({ basket: 'integrity' });

      if (!outputs || outputs.length === 0) {
        alert('No integrity proofs found. Please create them first.');
        return;
      }

      // Fetch current data to validate
      const response = await fetch(`${API_BASE_URL}/data/altered`);
      const data: ApiResponse = await response.json();
      const currentRecords = [data.results[2], data.results[4]];

      const results = { record3: false, record5: false };

      // Validate each record
      for (let i = 0; i < Math.min(outputs.length, 2); i++) {
        const output = outputs[i];

        // Parse transaction from BEEF format
        if (output.beef) {
          const tx = Transaction.fromBEEF(output.beef);

          // Verify transaction
          await tx.verify();

          // Extract data from OP_RETURN
          const script = tx.outputs[output.vout].lockingScript;
          const chunks = script.chunks;

          // Find the data chunk (after OP_FALSE and OP_RETURN)
          if (chunks.length >= 3) {
            const dataChunk = chunks[2];
            if (dataChunk.data) {
              const storedData = Buffer.from(dataChunk.data).toString('utf8');
              const storedRecord = JSON.parse(storedData);
              const currentRecord = currentRecords[i];

              // Compare stored data with current data
              if (i === 0) {
                results.record3 = JSON.stringify(storedRecord) === JSON.stringify(currentRecord);
              } else {
                results.record5 = JSON.stringify(storedRecord) === JSON.stringify(currentRecord);
              }
            }
          }
        }
      }

      setValidationResults(results);
    } catch (error) {
      console.error('Error validating data integrity:', error);
      alert('Failed to validate data integrity. See console for details.');
    }
  };

  useEffect(() => {
    fetchDataWithoutBsv();
    fetchDataWithBsv();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const renderRecord = (record: Award, index: number, isCompromised: boolean) => {
    const isRecord3 = index === 2;
    const isRecord5 = index === 4;
    const showHighlight = isRecord3 || isRecord5;

    return (
      <div
        key={record.internal_id}
        className={`p-4 border rounded-lg ${
          showHighlight && isCompromised ? 'border-red-500 bg-red-50' : 'border-gray-200'
        }`}
      >
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{record['Recipient Name']}</h3>
            <p className="text-sm text-muted-foreground">{record['Award ID']}</p>
          </div>
          {showHighlight && isCompromised && (
            <Badge variant="destructive">Modified</Badge>
          )}
        </div>
        <p className="text-sm mb-2">{record.Description}</p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="font-medium">Award Amount:</span>{' '}
            <span className={isRecord3 && isCompromised ? 'text-red-600 font-bold' : ''}>
              {formatCurrency(record['Award Amount'])}
            </span>
          </div>
          <div>
            <span className="font-medium">Agency:</span> {record['Awarding Agency']}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">BSV Data Integrity Demo</h1>
        <p className="text-muted-foreground">
          Demonstrating how BSV blockchain can verify data integrity and detect unauthorized changes
        </p>
      </div>

      <Tabs defaultValue="without" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="without">
            <ShieldAlert className="w-4 h-4 mr-2" />
            Without BSV Blockchain
          </TabsTrigger>
          <TabsTrigger value="with">
            <Shield className="w-4 h-4 mr-2" />
            With BSV Blockchain
          </TabsTrigger>
        </TabsList>

        <TabsContent value="without" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Without Blockchain Integrity Protection</CardTitle>
              <CardDescription>
                Data is fetched from the database but there's no way to verify if it has been tampered with.
                Records 3 and 5 have been modified, but you can't detect it!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900">No Integrity Verification</p>
                  <p className="text-sm text-yellow-700">
                    The database has been compromised, but without blockchain verification,
                    there's no way to detect the unauthorized changes.
                  </p>
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {isLoadingWithout ? (
                  <p>Loading...</p>
                ) : (
                  withoutBsvData.slice(0, 10).map((record, index) => renderRecord(record, index, true))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="with" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>With BSV Blockchain Integrity Protection</CardTitle>
              <CardDescription>
                Data integrity is cryptographically verified using the BSV blockchain.
                Any tampering is immediately detected!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 space-y-3">
                <Button
                  onClick={createIntegrityProofs}
                  disabled={!isInitialized || integrityProofCreated}
                  className="w-full"
                >
                  {integrityProofCreated ? 'Integrity Proofs Created ✓' : 'Create Integrity Proofs'}
                </Button>

                {integrityProofCreated && (
                  <Button
                    onClick={validateDataIntegrity}
                    variant="outline"
                    className="w-full"
                  >
                    Validate Data Integrity
                  </Button>
                )}

                {validationResults.record3 !== null && (
                  <div className="space-y-2">
                    <div className={`p-4 rounded-lg border flex items-start gap-2 ${
                      validationResults.record3
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}>
                      {validationResults.record3 ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                      )}
                      <div>
                        <p className="font-medium">Record 3 (Award ID: W31P4Q14C0034)</p>
                        <p className="text-sm">
                          {validationResults.record3
                            ? 'Data integrity verified ✓'
                            : 'TAMPERING DETECTED! Award amount has been modified!'}
                        </p>
                      </div>
                    </div>

                    <div className={`p-4 rounded-lg border flex items-start gap-2 ${
                      validationResults.record5
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}>
                      {validationResults.record5 ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                      )}
                      <div>
                        <p className="font-medium">Record 5 (Award ID: FA910115C0500)</p>
                        <p className="text-sm">
                          {validationResults.record5
                            ? 'Data integrity verified ✓'
                            : 'TAMPERING DETECTED! Recipient name has been modified!'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {isLoadingWith ? (
                  <p>Loading...</p>
                ) : (
                  withBsvData.slice(0, 10).map((record, index) => renderRecord(record, index, false))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
