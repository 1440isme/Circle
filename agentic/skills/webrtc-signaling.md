# Skill: WebRTC Signaling

Procedure for managing audio/video peer connection signaling in CIRCLE.

---

## When to Use
- Implementing or debugging 1-on-1 or group voice/video calling features.

---

## Steps

1. **Signaling Flow via Socket.IO:**
   - **Call Initiation:** Caller emits `rtc:call-user` with `targetUserId` and optional circle channel.
   - **Offer:** Caller creates WebRTC `RTCPeerConnection`, creates SDP offer, sets local description, emits `rtc:offer`.
   - **Answer:** Callee receives offer, sets remote description, creates SDP answer, sets local description, emits `rtc:answer`.
   - **ICE Candidates:** Both peers listen for `icecandidate` events and exchange them via `rtc:ice-candidate`.
2. **STUN/TURN Configuration:**
   - Always load ICE server configs from environment variables.
   - Ensure fallback TURN server is configured for restrictive symmetric NATs.
3. **Media Stream Handling:**
   - Attach local stream to audio/video elements.
   - Attach remote track to UI audio/video stage.
