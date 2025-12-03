import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWallet } from '@/context/WalletContext';
import { LockingScript, Transaction, Utils } from '@bsv/sdk';
import type { ApiResponse, Award } from '@/types';
import { AlertCircle, CheckCircle, Shield, ShieldAlert, Link2 } from 'lucide-react';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export function DataIntegrityDemo() {
  const { wallet, isInitialized } = useWallet();
  const [withoutBsvData, setWithoutBsvData] = useState<Award[]>([]);
  const [withBsvData, setWithBsvData] = useState<Award[]>([]);
  const [isLoadingWithout, setIsLoadingWithout] = useState(false);
  const [isLoadingWith, setIsLoadingWith] = useState(false);
  const [integrityProofCreated, setIntegrityProofCreated] = useState(false);
  const [isHacked, setIsHacked] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeTab, setActiveTab] = useState('without');
  const [txids, setTxids] = useState<string[]>([]);
  const [validationResults, setValidationResults] = useState<{
    record3: boolean | null;
    record5: boolean | null;
  }>({ record3: null, record5: null });

  // Fetch original data (both tabs start with this)
  const fetchOriginalData = async () => {
    setIsLoadingWithout(true);
    setIsLoadingWith(true);
    try {
      const response = await fetch(`${API_BASE_URL}/data/original`);
      const data: ApiResponse = await response.json();
      setWithoutBsvData(data.results);
      setWithBsvData(data.results);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoadingWithout(false);
      setIsLoadingWith(false);
    }
  };

  // Simulate a hack - replaces data with altered version with opacity animation
  const initiateHack = async () => {
    setIsAnimating(true);

    // Fade out
    await new Promise(resolve => setTimeout(resolve, 100));

    // Fetch altered data
    try {
      const response = await fetch(`${API_BASE_URL}/data/altered`);
      const data: ApiResponse = await response.json();
      setWithoutBsvData(data.results);
      setWithBsvData(data.results);
      setIsHacked(true);
    } catch (error) {
      console.error('Error fetching altered data:', error);
    }

    // Fade in
    await new Promise(resolve => setTimeout(resolve, 100));
    setIsAnimating(false);
  };

  // Reset demo to initial state
  const resetDemo = async () => {
    setIsHacked(false);
    setIntegrityProofCreated(false);
    setValidationResults({ record3: null, record5: null });
    setTxids([]);
    await fetchOriginalData();
  };

  // Create integrity proofs for records 3 and 5
  const createIntegrityProofs = async () => {
    if (!wallet || !isInitialized) {
      toast.error('Wallet not initialized');
      return;
    }

    toast.loading('Creating integrity proofs...');

    try {
      // Fetch the original records we want to protect
      const response = await fetch(`${API_BASE_URL}/data/records`);
      const records: Award[] = await response.json();

      const lockingScripts: string[] = [];
      // Create integrity proofs for each record
      for (const record of records) {
        const recordData = JSON.stringify(record);
        const dataHex = Utils.toHex(Utils.toArray(recordData, 'utf8'));

        // Create OP_FALSE OP_RETURN script with the data
        const lockingScript = LockingScript.fromASM(`OP_FALSE OP_RETURN ${dataHex}`).toHex();
        lockingScripts.push(lockingScript);
      }

      // Create action using WalletClient
      const result = await wallet.createAction({
        description: `Data integrity proofs`,
        outputs: lockingScripts.map((lockingScript) => ({
          outputDescription: `Data integrity marker`,
          lockingScript,
          satoshis: 0,
          basket: 'integrity'
        })),
      });

      // Extract txid from the result
      if (result && result.txid) {
        setTxids([result.txid]);
      }

      setIntegrityProofCreated(true);
      toast.dismiss();
      toast.success('Integrity proofs created successfully!');
    } catch (error) {
      console.error('Error creating integrity proofs:', error);
      toast.dismiss();
      toast.error('Failed to create integrity proofs. Check console for details.');
    }
  };

  // Validate data integrity using BSV
  const validateDataIntegrity = async () => {
    if (!wallet || !isInitialized) {
      toast.error('Wallet not initialized');
      return;
    }

    toast.loading('Validating data integrity...');

    try {
      // List outputs with integrity basket
      const { BEEF, outputs } = await wallet.listOutputs({ basket: 'integrity' });

      if (!outputs || outputs.length === 0) {
        toast.dismiss();
        toast.error('No integrity proofs found. Please create them first.');
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
        if (BEEF) {
          const tx = Transaction.fromBEEF(BEEF);

          // Verify transaction
          await tx.verify();

          // Extract data from OP_RETURN
          const script = tx.outputs[Number(output.outpoint.split('.')[1])].lockingScript;
          const chunks = script.chunks;

          // Find the data chunk (after OP_FALSE and OP_RETURN)
          if (chunks.length >= 3) {
            const dataChunk = chunks[2];
            if (dataChunk.data) {
              const storedData = Utils.toUTF8(dataChunk.data);
              const storedRecord = JSON.parse(storedData);
              const currentRecord = currentRecords[i];

              // Compare stored data with current data
              const isValid = JSON.stringify(storedRecord) === JSON.stringify(currentRecord);
              if (i === 0) {
                results.record3 = isValid;
              } else {
                results.record5 = isValid;
              }
            }
          }
        }
      }

      setValidationResults(results);
      toast.dismiss();

      // Show success or warning toast based on results
      if (!results.record3 || !results.record5) {
        toast.error('Data tampering detected! Check the highlighted records.');
      } else {
        toast.success('All data integrity checks passed!');
      }
    } catch (error) {
      console.error('Error validating data integrity:', error);
      toast.dismiss();
      toast.error('Failed to validate data integrity. Check console for details.');
    }
  };

  useEffect(() => {
    fetchOriginalData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const renderRecord = (record: Award, index: number, showValidationIssues: boolean) => {
    const isRecord3 = index === 2;
    const isRecord5 = index === 4;
    const showIssue = (isRecord3 || isRecord5) && showValidationIssues;

    return (
      <div
        key={record.internal_id}
        className={`grid grid-cols-12 gap-2 px-3 py-2 text-sm border-b hover:bg-gray-50 transition-opacity duration-1000 ${
          showIssue ? 'bg-red-50 border-red-300' : 'border-gray-200'
        } ${isAnimating ? 'opacity-0' : 'opacity-100'}`}
      >
        <div className="col-span-1 flex items-center font-mono text-xs text-gray-500">
          {index + 1}
        </div>
        <div className="col-span-2 flex items-center font-medium truncate">
          {record['Award ID']}
        </div>
        <div className={`col-span-3 flex items-center truncate ${
          isRecord5 && showIssue ? 'text-red-600 font-semibold' : ''
        }`}>
          {record['Recipient Name']}
        </div>
        <div className={`col-span-2 flex items-center justify-end font-mono ${
          isRecord3 && showIssue ? 'text-red-600 font-bold' : ''
        }`}>
          {formatCurrency(record['Award Amount'])}
        </div>
        <div className="col-span-3 flex items-center text-xs text-gray-600 truncate">
          {record.Description}
        </div>
        <div className="col-span-1 flex items-center justify-end gap-1">
          {showIssue && (
            <Badge variant="destructive" className="text-xs">Tampered</Badge>
          )}
          {txids.length > 0 && (
            <a
              href={`https://whatsonchain.com/tx/${txids[0]}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 transition-colors"
              title="View on WhatsOnChain"
            >
              <Link2 className="w-4 h-4" />
            </a>
          )}
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

      {/* Action Buttons */}
      <div className="mb-6 flex justify-center gap-4 flex-wrap">
        {/* Create Integrity Proofs Button */}
        <Button
          onClick={createIntegrityProofs}
          disabled={!isInitialized || integrityProofCreated || activeTab === 'without'}
          size="lg"
          className="text-lg px-8 py-6"
          variant={activeTab === 'without' ? 'ghost' : 'default'}
        >
          {integrityProofCreated ? '✓ Integrity Proofs Created' : 'Create Integrity Proofs'}
        </Button>

        {/* Initiate Hack Button */}
        <Button
          onClick={initiateHack}
          variant="destructive"
          size="lg"
          className="text-lg px-8 py-6"
          disabled={isHacked}
        >
          🔓 Initiate Hack
        </Button>

        {/* Reset Demo Button */}
        <Button
          onClick={resetDemo}
          variant="outline"
          size="lg"
          className="text-lg px-8 py-6"
        >
          🔄 Reset Demo
        </Button>

        {/* Validate Data Integrity Button */}
        {integrityProofCreated && (
          <Button
            onClick={validateDataIntegrity}
            variant={activeTab === 'without' ? 'ghost' : 'outline'}
            size="lg"
            className="text-lg px-8 py-6"
            disabled={activeTab === 'without' || validationResults.record3 !== null}
          >
            {validationResults.record3 !== null ? '✓ Validation Complete' : 'Validate Data Integrity'}
          </Button>
        )}
      </div>

      <Tabs defaultValue="without" className="w-full" onValueChange={setActiveTab}>
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
              <CardTitle>No Integrity Verification</CardTitle>
              <CardDescription>
                {!isHacked
                  ? "Data is displayed from the database with no integrity checks."
                  : "Data has been altered, but it's not immediately apparent and there's no way to check whether it's changed since original publication."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden bg-white">
                {/* Spreadsheet Header */}
                <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-semibold bg-gray-100 border-b-2 border-gray-300">
                  <div className="col-span-1">#</div>
                  <div className="col-span-2">Award ID</div>
                  <div className="col-span-3">Recipient Name</div>
                  <div className="col-span-2 text-right">Award Amount</div>
                  <div className="col-span-3">Description</div>
                  <div className="col-span-1 text-right">Status</div>
                </div>
                {/* Data Rows */}
                {isLoadingWithout ? (
                  <p className="p-4">Loading...</p>
                ) : (
                  withoutBsvData.map((record, index) => renderRecord(record, index, false))
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
                Create blockchain integrity proofs, then validate after a hack to detect tampering.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {validationResults.record3 !== null && (
                <div className="mb-4 space-y-2">
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

              <div className="border rounded-lg overflow-hidden bg-white">
                {/* Spreadsheet Header */}
                <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-semibold bg-gray-100 border-b-2 border-gray-300">
                  <div className="col-span-1">#</div>
                  <div className="col-span-2">Award ID</div>
                  <div className="col-span-3">Recipient Name</div>
                  <div className="col-span-2 text-right">Award Amount</div>
                  <div className="col-span-3">Description</div>
                  <div className="col-span-1 text-right">Status</div>
                </div>
                {/* Data Rows */}
                {isLoadingWith ? (
                  <p className="p-4">Loading...</p>
                ) : (
                  withBsvData.map((record, index) =>
                    renderRecord(record, index, validationResults.record3 !== null && !validationResults.record3)
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
