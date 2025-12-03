# Data Integrity

This demo should consist of a front end application in React / Vite with typescript tsx components using shadcn ui and a back end application in Node.js with express and typescript. 

## Source of Data

The data is stored in a JSON file in the data directory. We'll put each record in it's own transaction to simulate a real world accountability system where records are captures as the awards are given.

## Demo UI

What we want to show is that you can request data from the public API but in theory it could be changed in future. So we want to demonstrate the changing of some data in the "database" (we'll just use an altered file to simulate this). The front end will then demonstrate that if you do not have a data integrity check using the BSV Blockchain, then you don't know whether the data has changed or not. So there should be a "without BSV Blockchain" tab and a "with BSV Blockchain" tab. The "with BSV Blockchain" tab will show that change in the data is immediately detected and the "without BSV Blockchain" tab will show that the change is not detected. We should copy the response.json file and alter things like the value of an award in record number 3 and perhaps the name of the recipient in record number 5. 

Ideally a new WalletClient() should be instantiated in a WalletContext file which can then be brought into any component via useWallet() hook.

We should demonstrate the ease of creation of integrity proofs by taking records 3 and 5 from the original response and pushing the data into a locking script using the @bsv/sdk WalletClient createAction method, along with a LockingScript.fromASM('OP_FALSE OP_RETURN <data>') where <data> is the hex encoded data entry that output should be given the `basket` parameter "integrity".

The BSV Blockchain validation function is something we can use the WalletClient for too, simply pulling the transaction output we created using the listOutputs({ basket: "integrity" }) method, and then using tx.verify() on the resulting transaction object parsed from the response using the Transaction.fromBEEF(tx) method.

There should be a clear visual indication that the data's integrity has been locally confirmed.