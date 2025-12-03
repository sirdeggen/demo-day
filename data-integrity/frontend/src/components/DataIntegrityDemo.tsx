import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWallet } from '@/context/WalletContext';
import { LockingScript, Transaction, Utils } from '@bsv/sdk';
import type { ApiResponse, Award } from '@/types';
import { Shield, ShieldAlert, Link2, Link2Off } from 'lucide-react';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export function DataIntegrityDemo() {
  const { wallet, isInitialized } = useWallet();
  const [withoutBsvData, setWithoutBsvData] = useState<Award[]>([]);
  const [withBsvData, setWithBsvData] = useState<Award[]>([]);
  const [originalData, setOriginalData] = useState<Award[]>([]);
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
      setOriginalData(data.results);
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
    await new Promise(resolve => setTimeout(resolve, 1000));

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
    await new Promise(resolve => setTimeout(resolve, 1000));
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
        options: {
          randomizeOutputs: false
        }
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

  // Handle tab changes - reset when switching to BSV tab
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'with' && isHacked) {
      resetDemo();
    }
  };

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
    const showLink = index < 5;
    const originalRecord = originalData[index];

    return (
      <>
        {/* Tampered Record (Red) */}
        <div
          key={record.internal_id}
          className={`grid grid-cols-12 gap-2 px-3 py-2.5 text-sm border-b transition-all duration-1000 ${
            showIssue ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200 hover:bg-slate-50'
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
            {showLink && txids.length > 0 && (
              <>
                {showIssue 
                ? <Link2Off className="w-4 h-4" /> 
                : <a
                  href={`https://whatsonchain.com/tx/${txids[0]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                  title="View on WhatsOnChain"
              >
                <Link2 className="w-4 h-4" />
              </a>}
              </>
            )}
          </div>
        </div>

        {/* Original Record (Green) - Show only when tampering detected */}
        {showIssue && originalRecord && (
          <div
            className="grid grid-cols-12 gap-2 px-3 py-2.5 text-sm border-b bg-green-50 border-green-200 transition-all duration-1000"
          >
            <div className="col-span-1 flex items-center font-mono text-xs text-gray-500">
              {index + 1}
            </div>
            <div className="col-span-2 flex items-center font-medium truncate">
              {originalRecord['Award ID']}
            </div>
            <div className={`col-span-3 flex items-center truncate ${
              isRecord5 ? 'text-green-600 font-semibold' : ''
            }`}>
              {originalRecord['Recipient Name']}
            </div>
            <div className={`col-span-2 flex items-center justify-end font-mono ${
              isRecord3 ? 'text-green-600 font-bold' : ''
            }`}>
              {formatCurrency(originalRecord['Award Amount'])}
            </div>
            <div className="col-span-3 flex items-center text-xs text-gray-600 truncate">
              {originalRecord.Description}
            </div>
            <div className="col-span-1 flex items-center justify-end gap-1">
              <Badge variant="default" className="text-xs bg-green-600">Original</Badge>
              {showLink && txids.length > 0 && (
                <a
                  href={`https://whatsonchain.com/tx/${txids[0]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                  title="View on WhatsOnChain"
                >
                  {<Link2 className="w-4 h-4" />}
                </a>
              )}
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/20 via-transparent to-indigo-900/20 pointer-events-none"></div>

      <div className="container mx-auto p-8 relative z-10">
        <div className="mb-12 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-indigo-300 to-blue-400 bg-clip-text text-transparent drop-shadow-2xl">
              BSV Data Integrity Demo
            </h1>
            <p className="text-xl text-slate-300 font-light tracking-wide">
              Demonstrating how BSV blockchain can verify data integrity and detect unauthorized changes
            </p>
          </div>

          {/* Reset Demo Button - Top Right */}
          <Button
            onClick={resetDemo}
            variant="outline"
            size="lg"
            className="text-lg px-6 py-6 bg-slate-800/60 backdrop-blur-md border-slate-600 text-slate-200 hover:bg-slate-700/80 hover:border-slate-500 hover:text-white hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300"
          >
            🔄 Reset Demo
          </Button>
        </div>

      <Tabs defaultValue="without" className="w-full" onValueChange={handleTabChange}>
        <TabsList className="grid w-full max-w-3xl mx-auto grid-cols-2 bg-slate-800/80 backdrop-blur-xl p-1.5 shadow-2xl shadow-slate-900/50 border border-slate-700 rounded-xl h-auto">
          <TabsTrigger
            value="without"
            className="text-slate-400 font-medium py-3 px-6 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:via-rose-500 data-[state=active]:to-red-600 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-red-500/50 transition-all duration-300 hover:text-slate-200"
          >
            <ShieldAlert className="w-5 h-5 mr-2" />
            Vulnerable Database
          </TabsTrigger>
          <TabsTrigger
            value="with"
            className="text-slate-400 font-medium py-3 px-6 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:via-indigo-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-blue-500/50 transition-all duration-300 hover:text-slate-200"
          >
            <Shield className="w-5 h-5 mr-2" />
            Protected With BSV Blockchain
          </TabsTrigger>
        </TabsList>

        <TabsContent value="without" className="space-y-4 mt-10">
          <Card className="bg-slate-800/40 backdrop-blur-md shadow-2xl shadow-slate-900/50 border border-slate-700/50">
            <CardHeader className="bg-gradient-to-r from-slate-800/60 via-red-900/30 to-slate-800/60 border-b border-slate-700/50 pb-6">
              <CardTitle className="text-3xl text-slate-100 font-bold">No Integrity Verification</CardTitle>
              <CardDescription className="text-lg text-slate-300 mt-2">
                {!isHacked
                  ? "Data is displayed from the database with no integrity checks."
                  : "Data has been altered, but it's not immediately apparent and there's no way to check whether it's changed since original publication."}
              </CardDescription>
              {/* Action Buttons */}
      <div className="mt-1 flex justify-end gap-5 flex-wrap">
        <Button
          onClick={initiateHack}
          variant="destructive"
          size="lg"
          className="text-lg px-10 py-7 bg-gradient-to-r from-red-500 via-rose-500 to-red-600 hover:from-red-600 hover:via-rose-600 hover:to-red-700 text-white font-semibold shadow-2xl shadow-red-500/50 hover:shadow-red-500/70 hover:scale-105 transition-all duration-300 disabled:opacity-30 border border-red-400/30"
          disabled={isHacked || (activeTab === 'with' && !integrityProofCreated)}
        >
          Simulate Data Manipulation
        </Button>
      </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="rounded-xl overflow-hidden shadow-2xl border border-slate-300">
                {/* Spreadsheet Header */}
                <div className="grid grid-cols-12 gap-2 px-3 py-3 text-xs font-bold bg-gradient-to-r from-slate-100 to-slate-50 border-b-2 border-slate-300 text-slate-700">
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

        <TabsContent value="with" className="space-y-4 mt-10">
          <Card className="bg-slate-800/40 backdrop-blur-md shadow-2xl shadow-slate-900/50 border border-slate-700/50">
            <CardHeader className="bg-gradient-to-r from-slate-800/60 via-blue-900/30 to-slate-800/60 border-b border-slate-700/50 pb-6">
              <CardTitle className="text-3xl bg-gradient-to-r from-blue-400 via-indigo-300 to-blue-400 bg-clip-text text-transparent font-bold">
                With BSV Blockchain Integrity Protection
              </CardTitle>
              <CardDescription className="text-lg text-slate-300 mt-2">
                Create blockchain integrity proofs, then validate after a hack to detect tampering.
              </CardDescription>
              {/* Action Buttons */}
      <div className="mt-1 flex justify-end gap-5 flex-wrap">
        {/* Create Integrity Proofs Button */}
        <Button
          onClick={createIntegrityProofs}
          disabled={!isInitialized || integrityProofCreated || activeTab === 'without'}
          size="lg"
          className="text-lg px-10 py-7 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 hover:from-blue-600 hover:via-indigo-600 hover:to-blue-700 text-white font-semibold shadow-2xl shadow-blue-500/50 hover:shadow-blue-500/70 hover:scale-105 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 border border-blue-400/30"
          variant={activeTab === 'without' ? 'ghost' : 'default'}
        >
          {integrityProofCreated ? '✓ Integrity Proofs Created' : 'Create Integrity Proofs'}
        </Button>

        {/* Initiate Hack Button */}
        <Button
          onClick={initiateHack}
          variant="destructive"
          size="lg"
          className="text-lg px-10 py-7 bg-gradient-to-r from-red-500 via-rose-500 to-red-600 hover:from-red-600 hover:via-rose-600 hover:to-red-700 text-white font-semibold shadow-2xl shadow-red-500/50 hover:shadow-red-500/70 hover:scale-105 transition-all duration-300 disabled:opacity-30 border border-red-400/30"
          disabled={isHacked || (activeTab === 'with' && !integrityProofCreated)}
        >
          Simulate Data Manipulation
        </Button>

        {/* Validate Data Integrity Button */}
          <Button
            onClick={validateDataIntegrity}
            variant={!integrityProofCreated || !isHacked ? 'ghost' : 'outline'}
            size="lg"
            className="text-lg px-10 py-7 bg-green-800/60 backdrop-blur-md border-2 border-green-600 text-green-200 hover:bg-green-700/80 hover:border-green-500 hover:text-white font-semibold shadow-xl shadow-green-900/50 hover:shadow-2xl hover:shadow-green-700/50 hover:scale-105 transition-all duration-300 disabled:opacity-30"
            disabled={!integrityProofCreated || !isHacked}
          >
            {validationResults.record3 !== null ? '✓ Validation Complete' : 'Validate Data Integrity'}
          </Button>
      </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="rounded-xl overflow-hidden shadow-2xl border border-slate-300">
                {/* Spreadsheet Header */}
                <div className="grid grid-cols-12 gap-2 px-3 py-3 text-xs font-bold bg-gradient-to-r from-slate-100 to-slate-50 border-b-2 border-slate-300 text-slate-700">
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
    </div>
  );
}
