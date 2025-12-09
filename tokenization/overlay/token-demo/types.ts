export interface TokenDemoRecord {
  txid: string
  outputIndex: number
  tokenID: string
  amount: number
}

export interface UTXOReference {
  txid: string
  outputIndex: number
}