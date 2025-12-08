export default `
# TokenDemo Topic Manager Documentation

## Overview
The **TokenDemo Topic Manager** is a lightweight overlay protocol that lets users broadcast a short, UTF‑8 encoded message to the world using BRC‑48 Pay‑to‑Push‑Drop outputs. Each eligible transaction output becomes a permanent, verifiable "shout‑out" on-chain.

| Requirement | Description |
|-------------|-------------|
| **Protocol ID** | "TokenDemo" |
| **Fields** | *Exactly one (the message)* |
| **Message length** | ≥ 2 UTF‑8 characters |
| **Signature** | ECDSA over the concatenated field data, verified against the locking public key |
`
