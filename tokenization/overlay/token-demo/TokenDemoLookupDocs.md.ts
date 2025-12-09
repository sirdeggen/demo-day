export default `
# TokenDemo Lookup Service Documentation

## Overview
The **TokenDemo Lookup Service** (service ID: \`ls_TokenDemo\`) lets clients search the on-chain *Hello-World* messages that are indexed by the **TokenDemo Topic Manager**. Each record represents a Pay-to-Push-Drop output whose single field is a UTF-8 message of at least two characters.

## Example
\`\`\`typescript
import { LookupResolver } from '@bsv/sdk'

const overlay = new LookupResolver()

const response = await overlay.query({ 
    service: 'ls_tokendemo', 
    query: {
        outpoint: 'txid:outputIndex'
    } 
}, 10000)
\`\`\`
`
