# Tokenization

## Overview

What we're trying to achieve with this demo is to illustrate the simplicity with which companies are now able to create their own tokens on top of BSV Blockchain. To be more specific we want to demonstrate the creation, transfer, and revocation of a set of tokens.

## Features

The token issuance properties should be flexible enough to accommodate fungible tokens and NFTs. We should demonstrate issuance and redemption of store credit as a fungible token example; and tickets to an F1 Race as an NFT example.

## Tech

Clone the frontend from access-control demo, then remove the specific content to create this starting point for this tokenization app. So Vite and React with Typescript.

We ought to use PushDrop class from the @bsv/sdk to create and redeem tokens using the lock and unlock methods respectively. The fields to use will depend on the particular token type but in general the approach ought to be to mint a token with some properties defining it, then refer to that mint txid in subsequent spends of the token to reduce the amount of data necessary to include in each token. 

Example Token Fields:
```
tokenID: "Local Store Credits" // UTF8 string
amount: 10000 // Uint64LE
```

To get a PushDrop token we do:
```ts
const token = new PushDrop(wallet)
const protocolID = [2, 'store credit']
const keyID = Utils.toBase64(Random(8))
const counterparty = 'self'
const lockingScript = await token.lock(fields, protocolID, keyID, counterparty, true, true)
```

To unlock it later we do:
```ts
await token.unlock(protocolID, keyID, counterparty)
```

We'll need a frontend, and an overlay-service which validates each new transaction as either a mint or transfer of existing tokens.

## Demo UI

We ought to start on the "Create Simple Tokens" page which allows us to create new sets of tokens whenever we like. The default fields for fungible tokens ought to be "tokenID" and "amount". We ought to be able to add arbitrary fields to our tokens at issuance. These should come in field name to value pairs, the type for these custom fields ought to be UTF8 string for simplicity. 

A button to "Create" ought to initiate the creation of tokens using the fields specified. These tokens should then appear in a wallet section which keeps track of the balances per tokenID.

There should then be a facility to send the tokens to a counterparty by making use of the useIdentitySearch hook from '@bsv/identity-react' to acquire a identityKey associated with someone else, to be used in a new PushDrop output which uses that identityKey in place of the "self" counterparty when generating a new lockingScript. The UI should simply allow the user to select a tokenID, amount to send, and recipient - "Send" button would then create the transaction which transfers the tokens. This transaction ought to be sent to the counterparty's message-box server using the @bsv/message-box-client class MessageBoxClient where the message includes the transaction itself, and the key derivation matrial for import (keyID, senderIdentityKey, and protocolID).

We'll then swap accounts in our demo wallet to call the "accept tokens" method which will update the balance of the new user who received the funds.