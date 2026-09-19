# WebRTC Setup & STUN/TURN Configuration

Guide for configuring WebRTC audio and video calling in CIRCLE.

---

## 1. Network Traversal (STUN / TURN)
Direct peer-to-peer WebRTC connections fail in approximately 15-20% of network scenarios due to symmetric NATs and restrictive firewalls. A TURN server is required to relay encrypted media packets.

---

## 2. Configuration Parameters
Add the following credentials to `.env`:
```bash
STUN_SERVER_URL="stun:stun.l.google.com:19302"
TURN_SERVER_URL="turn:turn.circle.example.com:3478"
TURN_USERNAME="circle-user"
TURN_CREDENTIAL="circle-turn-secret"
```

The client dynamically requests ICE server configurations from `GET /api/v1/realtime/ice-servers` upon initiating or receiving a call.
