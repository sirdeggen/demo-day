import docs from './TokenDemoLookupDocs.md.js'
import {
  LookupService,
  LookupQuestion,
  LookupAnswer,
  LookupFormula,
  AdmissionMode,
  SpendNotificationMode,
  OutputAdmittedByTopic,
  OutputSpent
} from '@bsv/overlay'
import { TokenDemoStorage } from './TokenDemoStorage.js'
import { PushDrop, Utils } from '@bsv/sdk'
import { Db } from 'mongodb'

export interface TokenDemoQuery {
  message?: string
  limit?: number
  skip?: number
  startDate?: Date
  endDate?: Date
  sortOrder?: 'asc' | 'desc'
}

/**
 * Implements a lookup service for the Hello‑World protocol.
 * Each admitted BRC‑48 Pay‑to‑Push‑Drop output stores **exactly one** UTF‑8 field – the message.
 * This service indexes those messages so they can be queried later.
 */
export class TokenDemoLookupService implements LookupService {
  readonly admissionMode: AdmissionMode = 'locking-script'
  readonly spendNotificationMode: SpendNotificationMode = 'none'

  constructor(public storage: TokenDemoStorage) { }

  /**
   * Invoked when a new output is added to the overlay.
   * @param payload 
   */
  async outputAdmittedByTopic(payload: OutputAdmittedByTopic): Promise<void> {
    try {
      if (payload.mode !== 'locking-script') throw new Error('Invalid mode')
      const { topic, lockingScript, txid, outputIndex } = payload
      if (payload.topic !== 'tm_TokenDemo') return

      // Decode the PushDrop token
      const result = PushDrop.decode(lockingScript)
      if (!result.fields || result.fields.length < 1) throw new Error('Invalid TokenDemo token: wrong field count')

      const message = Utils.toUTF8(result.fields[0])
      if (message.length < 2) throw new Error('Invalid TokenDemo token: message too short')

      // Persist for future lookup
      await this.storage.storeRecord(txid, outputIndex, message)
    } catch (err) {
      const { txid, outputIndex } = payload as { txid: string; outputIndex: number }
      console.error(`TokenDemoLookupService: failed to index ${txid}.${outputIndex}`, err)
    }
  }

  /**
   * Invoked when a UTXO is spent
   * @param payload - The output admitted by the topic manager
   */
  async outputSpent(payload: OutputSpent): Promise<void> {
    if (payload.mode !== 'none') throw new Error('Invalid mode')
    const { topic, txid, outputIndex } = payload
    if (topic === 'tm_TokenDemo') {
      await this.storage.deleteRecord(txid, outputIndex)
    }
  }

  /**
   * LEGAL EVICTION: Permanently remove the referenced UTXO from all indices maintained by the Lookup Service
   * @param txid - The transaction ID of the output to evict
   * @param outputIndex - The index of the output to evict
   */
  async outputEvicted(txid: string, outputIndex: number): Promise<void> {
    await this.storage.deleteRecord(txid, outputIndex)
  }

  /**
   * Answers a lookup query
   * @param question - The lookup question to be answered
   * @returns A promise that resolves to a lookup answer or formula
   */
  async lookup(question: LookupQuestion): Promise<LookupFormula> {
    if (!question) throw new Error('A valid query must be provided!')
    if (question.service !== 'ls_TokenDemo') throw new Error('Lookup service not supported!')

    const {
      message,
      limit = 50,
      skip = 0,
      startDate,
      endDate,
      sortOrder
    } = question.query as TokenDemoQuery

    // Basic validation
    if (limit < 0) throw new Error('Limit must be a non‑negative number')
    if (skip < 0) throw new Error('Skip must be a non‑negative number')

    const from = startDate ? new Date(startDate) : undefined
    const to = endDate ? new Date(endDate) : undefined
    if (from && isNaN(from.getTime())) throw new Error('Invalid startDate provided!')
    if (to && isNaN(to.getTime())) throw new Error('Invalid endDate provided!')

    if (message) {
      return this.storage.findByMessage(message, limit, skip, sortOrder)
    }

    return this.storage.findAll(limit, skip, from, to, sortOrder)
  }

  /** Overlay docs. */
  async getDocumentation(): Promise<string> {
    return docs
  }

  /** Metadata for overlay hosts. */
  async getMetaData(): Promise<{
    name: string
    shortDescription: string
    iconURL?: string
    version?: string
    informationURL?: string
  }> {
    return {
      name: 'TokenDemo Lookup Service',
      shortDescription: 'Find messages on‑chain.'
    }
  }
}

// Factory
export default (db: Db): TokenDemoLookupService => new TokenDemoLookupService(new TokenDemoStorage(db))
