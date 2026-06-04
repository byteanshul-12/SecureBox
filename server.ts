import express from "express";
import path from "path";
import * as dotenv from "dotenv";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { adminAuth, adminDb as adminDbRaw } from "./src/lib/firebase-admin.ts";

// --- SAFE SECURE DATABASE LAYER (WITH IN-MEMORY HIGH-FIDELITY FALLBACKS) ---
const memoryStore = new Map<string, any>();

function getMemoryKey(collectionPath: string, docId?: string): string {
  return docId ? `${collectionPath}/${docId}` : collectionPath;
}

class SafeDocumentSnapshot {
  constructor(private existsVal: boolean, private dataVal: any, public id?: string) {}
  get exists() { return this.existsVal; }
  data() { return this.dataVal; }
}

class SafeQuerySnapshot {
  constructor(public docs: any[]) {}
}

class SafeDocumentReference {
  constructor(private collPath: string, private docId: string, private realDocRef: any) {}

  async get() {
    try {
      if (this.realDocRef) {
        return await this.realDocRef.get();
      }
    } catch (err) {
      console.warn(`Firestore get fail for document ref ${this.collPath}/${this.docId}, falling back to memory:`, err);
    }
    const memKey = getMemoryKey(this.collPath, this.docId);
    const cached = memoryStore.get(memKey);
    return new SafeDocumentSnapshot(cached !== undefined, cached, this.docId);
  }

  async set(data: any, options?: { merge?: boolean }) {
    try {
      if (this.realDocRef) {
        await this.realDocRef.set(data, options);
      }
    } catch (err) {
      console.warn(`Firestore set fail for document ref ${this.collPath}/${this.docId}, falling back to memory:`, err);
    }
    const memKey = getMemoryKey(this.collPath, this.docId);
    if (options?.merge) {
      const existing = memoryStore.get(memKey) || {};
      memoryStore.set(memKey, { ...existing, ...data });
    } else {
      memoryStore.set(memKey, data);
    }
    return { success: true };
  }

  async update(data: any) {
    try {
      if (this.realDocRef) {
        await this.realDocRef.update(data);
      }
    } catch (err) {
      console.warn(`Firestore update fail for document ref ${this.collPath}/${this.docId}, falling back to memory:`, err);
    }
    const memKey = getMemoryKey(this.collPath, this.docId);
    const existing = memoryStore.get(memKey) || {};
    memoryStore.set(memKey, { ...existing, ...data });
    return { success: true };
  }

  async delete() {
    try {
      if (this.realDocRef && typeof this.realDocRef.delete === "function") {
        await this.realDocRef.delete();
      }
    } catch (err) {
      console.warn(`Firestore delete failed for document ${this.collPath}/${this.docId}:`, err);
    }
    const memKey = getMemoryKey(this.collPath, this.docId);
    memoryStore.delete(memKey);
    return { success: true };
  }

  collection(subCollName: string) {
    const realSubColl = this.realDocRef ? this.realDocRef.collection(subCollName) : null;
    return new SafeCollectionReference(`${this.collPath}/${this.docId}/${subCollName}`, realSubColl);
  }
}

class SafeCollectionReference {
  constructor(private collPath: string, private realCollRef: any) {}

  doc(docId: string) {
    const realDoc = this.realCollRef ? this.realCollRef.doc(docId) : null;
    return new SafeDocumentReference(this.collPath, docId, realDoc);
  }

  async add(data: any) {
    const generatedId = Math.random().toString(36).substring(2, 15);
    try {
      if (this.realCollRef) {
        const added = await this.realCollRef.add(data);
        return { id: added.id };
      }
    } catch (err) {
      console.warn(`Firestore add fail for collection ref ${this.collPath}, falling back to memory:`, err);
    }
    const memKey = getMemoryKey(this.collPath, generatedId);
    memoryStore.set(memKey, { id: generatedId, ...data });
    return { id: generatedId };
  }

  async get() {
    try {
      if (this.realCollRef) {
        return await this.realCollRef.get();
      }
    } catch (err) {
      console.warn(`Firestore get fail for collection ref ${this.collPath}, falling back to memory:`, err);
    }
    
    const docsVal: any[] = [];
    const prefix = `${this.collPath}/`;
    for (const [key, val] of memoryStore.entries()) {
      if (key.startsWith(prefix)) {
        const remainingID = key.slice(prefix.length);
        if (!remainingID.includes("/")) {
          docsVal.push(new SafeDocumentSnapshot(true, val, remainingID));
        }
      }
    }
    return new SafeQuerySnapshot(docsVal);
  }
}

class SafeFirestore {
  constructor(private realDb: any) {}
  collection(collName: string) {
    const realColl = this.realDb ? this.realDb.collection(collName) : null;
    return new SafeCollectionReference(collName, realColl);
  }
}

const db = new SafeFirestore(adminDbRaw);

dotenv.config();

const app = express();
const PORT = 3000;

const JWT_SECRET = process.env.JWT_SECRET || "securebox_secret_jwt_key_2026_x9s7d";

// Standard JWT signer
function generateJWT(payload: any): string {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64url");
    
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// Standard JWT verifier
function verifyJWT(token: string): any {
  try {
    const [headerB64, payloadB64, signature] = token.split(".");
    if (!headerB64 || !payloadB64 || !signature) return null;
    
    const expectedSignature = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${headerB64}.${payloadB64}`)
      .digest("base64url");
      
    if (signature !== expectedSignature) return null;
    
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
    return payload;
  } catch (err) {
    return null;
  }
}

// Initialize Google GenAI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

app.use(express.json());

// API health check
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// OPT verification cache (fallback if Firebase is delayed)
const localOtpCache = new Map<string, { otp: string; expiresAt: number; email: string }>();

/**
 * 1. SIMULATED OTP LOGIN - SEND OTP
 */
app.post("/api/auth/otp/send", async (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "A valid email address is required" });
  }

  try {
    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes validity
    const verificationId = Math.random().toString(36).substring(2, 15);

    // Write to Firestore under public verification node safely
    await db.collection("otp_verifications").doc(verificationId).set({
      email,
      otp: generatedCode,
      expiresAt: new Date(expiry).toISOString(),
      verified: false,
    });

    // Store in local backup maps
    localOtpCache.set(verificationId, {
      otp: generatedCode,
      expiresAt: expiry,
      email,
    });

    console.log(`[SecureBox OTP Service] Simulated email dispatch to ${email}. Code: ${generatedCode}`);

    // Return verificationId and debugCode for direct end user login transparency
    res.json({
      success: true,
      verificationId,
      message: `A simulated security check OTP was dispatched to ${email}`,
      debugCode: generatedCode, // Exposed for easy browser UI verification & testing
    });
  } catch (error: any) {
    console.error("Error creating verification OTP:", error);
    res.status(500).json({ error: "Failed to dispatch authentication code" });
  }
});

/**
 * 2. SIMULATED OTP LOGIN - VERIFY OTP
 */
app.post("/api/auth/otp/verify", async (req, res) => {
  const { verificationId, otp, email } = req.body;

  if (!verificationId || !otp || !email) {
    return res.status(400).json({ error: "Verification parameters are missing" });
  }

  try {
    // Check local cache first for super-fast retrieval
    const cached = localOtpCache.get(verificationId);
    let matched = false;

    if (cached) {
      if (cached.otp === otp && cached.email === email && cached.expiresAt > Date.now()) {
        matched = true;
        localOtpCache.delete(verificationId);
      }
    } else {
      // Lookup in Firestore
      const snap = await db.collection("otp_verifications").doc(verificationId).get();
      if (snap.exists) {
        const data = snap.data();
        if (
          data?.otp === otp &&
          data?.email === email &&
          new Date(data?.expiresAt).getTime() > Date.now()
        ) {
          matched = true;
          await db.collection("otp_verifications").doc(verificationId).update({ verified: true });
        }
      }
    }

    if (!matched) {
      return res.status(401).json({ error: "Invalid, mismatching, or expired security OTP" });
    }

    const sanitizedUid = "jwt_" + Buffer.from(email).toString("hex").substring(0, 24);
    
    // Check if user already exists or auto-register them
    const userRef = db.collection("users").doc(sanitizedUid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      await userRef.set({
        uid: sanitizedUid,
        email,
        displayName: email.split("@")[0],
        photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${sanitizedUid}`,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        protectionLevel: "balanced",
        subscription: "free",
      });
    } else {
      await userRef.update({
        lastLoginAt: new Date().toISOString(),
      });
    }

    // Create custom JWT Token securely
    const jwtToken = generateJWT({
      uid: sanitizedUid,
      email,
      provider: "otp",
    });

    res.json({ success: true, jwtToken, uid: sanitizedUid });
  } catch (error: any) {
    console.error("Error verifying verification OTP:", error);
    res.status(500).json({ error: "Failed to verify login token" });
  }
});

/**
 * 2.5 INSTANT BYPASS LOGIN - NO OTP REQUIRED
 */
app.post("/api/auth/instant-login", async (req, res) => {
  const { email } = req.body;

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "A valid email address is required for instant synchronization." });
  }

  try {
    const sanitizedUid = "jwt_" + Buffer.from(email).toString("hex").substring(0, 24);
    
    // Check if user already exists or auto-register them
    const userRef = db.collection("users").doc(sanitizedUid);
    const userSnap = await userRef.get();
    
    const defaultProfile = {
      uid: sanitizedUid,
      email,
      displayName: email.split("@")[0],
      photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${sanitizedUid}`,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      protectionLevel: "balanced",
      subscription: "free",
    };

    if (!userSnap.exists) {
      await userRef.set(defaultProfile);
    } else {
      await userRef.update({
        lastLoginAt: new Date().toISOString(),
      });
    }

    // Create a simple JWT token for stateless authenticated sessions
    const jwtToken = generateJWT({
      uid: sanitizedUid,
      email,
      provider: "instant",
    });

    res.json({ success: true, jwtToken, uid: sanitizedUid, profile: { ...defaultProfile, ...(userSnap.exists ? userSnap.data() : {}) } });
  } catch (error: any) {
    console.error("Error performing instant login:", error);
    res.status(500).json({ error: "Failed to authenticate your secure box session" });
  }
});

/**
 * 2.7 REST ENDPOINTS FOR RESILIENT DUAL DATA RETRIEVAL (REST OVER FIREBASE FALLBACK)
 */
app.get("/api/user/data", async (req, res) => {
  let customAuthUID = req.query.uid as string;
  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const decoded = verifyJWT(token);
    if (decoded && decoded.uid) {
      customAuthUID = decoded.uid;
    }
  }

  if (!customAuthUID) {
    return res.status(401).json({ error: "Unauthorized access path." });
  }

  try {
    const userRef = db.collection("users").doc(customAuthUID);
    const userSnap = await userRef.get();
    const profile = userSnap.exists ? userSnap.data() : null;

    const emailsSnap = await db.collection("users").doc(customAuthUID).collection("emails").get();
    const emails = emailsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const rulesSnap = await db.collection("users").doc(customAuthUID).collection("rules").get();
    const rules = rulesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const activitySnap = await db.collection("users").doc(customAuthUID).collection("activity").get();
    const activity = activitySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.json({ profile, emails, rules, activity });
  } catch (err: any) {
    console.error("Error retrieving user records:", err);
    res.status(500).json({ error: "Failed to load user credentials from store." });
  }
});

app.post("/api/user/rules", async (req, res) => {
  let customAuthUID = req.body.uid;
  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const decoded = verifyJWT(token);
    if (decoded && decoded.uid) {
      customAuthUID = decoded.uid;
    }
  }

  if (!customAuthUID) {
    return res.status(401).json({ error: "Unauthorized access path." });
  }

  const { action, ruleId, rule } = req.body;

  try {
    const rulesColl = db.collection("users").doc(customAuthUID).collection("rules");
    const activityColl = db.collection("users").doc(customAuthUID).collection("activity");

    if (action === "add" && rule) {
      const targetRuleId = ruleId || rule.id || ("rule_" + Math.random().toString(36).substring(2, 9));
      await rulesColl.doc(targetRuleId).set({ ...rule, id: targetRuleId });
      
      await activityColl.add({
        id: Math.random().toString(36).substring(2, 11),
        userId: customAuthUID,
        action: `Created safety rule: auto-${rule.action || "flag"} on emails classified as "${rule.emailType || "unknown"}"`,
        type: "rules",
        timestamp: new Date().toISOString()
      });
    } else if (action === "toggle" && ruleId) {
      const ruleRef = rulesColl.doc(ruleId);
      const snap = await ruleRef.get();
      if (snap.exists) {
        const currentData = snap.data();
        await ruleRef.update({ active: !currentData.active });
      }
    } else if (action === "delete" && ruleId) {
      const ruleRef = rulesColl.doc(ruleId);
      if (typeof ruleRef.delete === "function") {
        await ruleRef.delete();
      } else {
        await ruleRef.set(null);
      }
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error("Error managing rules collection:", err);
    res.status(500).json({ error: "Failed to update safety automation rules." });
  }
});

app.post("/api/user/settings", async (req, res) => {
  let customAuthUID = req.body.uid;
  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const decoded = verifyJWT(token);
    if (decoded && decoded.uid) {
      customAuthUID = decoded.uid;
    }
  }

  if (!customAuthUID) {
    return res.status(401).json({ error: "Unauthorized access path." });
  }

  const { protectionLevel, subscription } = req.body;

  try {
    const userRef = db.collection("users").doc(customAuthUID);
    await userRef.update({
      protectionLevel,
      subscription
    });

    const activityColl = db.collection("users").doc(customAuthUID).collection("activity");
    await activityColl.add({
      id: Math.random().toString(36).substring(2, 11),
      userId: customAuthUID,
      action: `Updated settings profile: Protection set to "${protectionLevel}", Plan set to "${subscription}"`,
      type: "system",
      timestamp: new Date().toISOString()
    });

    const snap = await userRef.get();
    res.json({ success: true, profile: snap.exists ? snap.data() : null });
  } catch (err: any) {
    console.error("Error setting custom configuration:", err);
    res.status(500).json({ error: "Failed to update settings context." });
  }
});

/**
 * 3. MANUAL COLD TEXT SCANNER
 */
app.post("/api/scan/manual", async (req, res) => {
  const { sender, subject, content } = req.body;

  if (!sender || !content) {
    return res.status(400).json({ error: "Sender and Content fields are required for manual assessment." });
  }

  try {
    const analysisPrompt = `Analyze this email for security issues. Identify spam indicators, fraudulent URLs, phishing contexts, malicious intents, or scams.
Sender: ${sender}
Subject: ${subject || "No Subject"}
Email Body Content:
${content}

You must return a rigorous security risk assessment strictly matching the JSON schema.`;

    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: analysisPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            spamScore: { type: Type.INTEGER, description: "Score from 0 to 100" },
            phishingScore: { type: Type.INTEGER, description: "Score from 0 to 100" },
            threatScore: { type: Type.INTEGER, description: "Score from 0 to 100" },
            confidenceScore: { type: Type.INTEGER, description: "Confidence score from 0 to 100" },
            riskLevel: { type: Type.STRING, description: "Safe, Low Risk, Medium Risk, High Risk, Critical" },
            classification: { type: Type.STRING, description: "Important, Personal, Work, Newsletter, Promotion, Marketing, Cold Outreach, Spam, Phishing, Scam, Suspicious" },
            explanation: { type: Type.STRING, description: "Explanation of findings" },
            riskFactors: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific indicators flagged" },
            recommendedAction: { type: Type.STRING, description: "Recommended response action" },
          },
          required: [
            "spamScore",
            "phishingScore",
            "threatScore",
            "confidenceScore",
            "riskLevel",
            "classification",
            "explanation",
            "riskFactors",
            "recommendedAction",
          ],
        },
      },
    });

    const parsedResponse = JSON.parse(result.text.trim());
    res.json({ success: true, results: parsedResponse });
  } catch (error: any) {
    console.error("Error manually scanning content:", error);
    res.status(500).json({ error: "AI Scanner Engine failed to analyze content. Please try again." });
  }
});

/**
 * 4. REAL GMAIL SYNC & SCAN LOGIC WITH OAUTH TOKEN (OR SANDBOX SIMULATION FALLBACK)
 */
app.post("/api/gmail/sync", async (req, res) => {
  let customAuthUID = req.headers["x-user-uid"];
  const googleAccessToken = req.headers["x-google-token"];

  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const decoded = verifyJWT(token);
    if (decoded && decoded.uid) {
      customAuthUID = decoded.uid;
    }
  }

  if (!customAuthUID || typeof customAuthUID !== "string") {
    return res.status(401).json({ error: "User authentication identification is missing" });
  }

  // Pre-configured high-fidelity simulated feeds for iframe dev testing environments
  const simulatedMails = [
    {
      id: "sim_msg_phish_001",
      from: "Netflix Support <no-reply-billing@netflix-secure-update.com>",
      to: "user@example.com",
      subject: "Urgent: Redetecting your billing method. Suspended account alert!",
      date: new Date(Date.now() - 10 * 60 * 1000).toUTCString(),
      snippet: "We were unable to process your monthly subscription payment. Complete identification check to unlock your digital assets immediately.",
      body: "Dear Customer, We recently had a payment processing issue with your profile. To maintain uninterrupted access to our streaming server, update your verification records. Click here to open Netflix Invoice Center: http://netflix-billing-update-99a3.net/invoice/pay."
    },
    {
      id: "sim_msg_malware_002",
      from: "HR Operations <hr-internal@company-records.net>",
      to: "user@example.com",
      subject: "Urgent Action: Download and review latest corporate bonus list Q2",
      date: new Date(Date.now() - 40 * 60 * 1000).toUTCString(),
      snippet: "All active team members are authorized to download the performance-indexed company bonuses checklist. Secure file inside.",
      body: "Hi team, find the Q2 Corporate Bonuses list in the file folder document attached as 'Bonus_Structure_Q2_Final_Secure.exe'. Run this security executable locally to generate your private verification credentials. Do not share outside the firewall."
    },
    {
      id: "sim_msg_spam_003",
      from: "Solana Alpha Launches <newsletters@solana-airdrop-news.org>",
      to: "user@example.com",
      subject: "Double your SOL wallet with early access smart contract (Limit 50 slots)",
      date: new Date(Date.now() - 120 * 60 * 1000).toUTCString(),
      snippet: "Claim your special 5x multiplier Web3 token. Connect your phantom wallet to gain allocation in decentralized cloud.",
      body: "Web3 Solana Token Airdrop is live. Gain massive investment options with decentralized cloud security layers. Open our decentralized launchpad at http://solana-multiplier-airdrop-protocol.xyz to participate. Terms apply."
    },
    {
      id: "sim_msg_transactional_004",
      from: "GitHub Notifications <notifications@github.com>",
      to: "user@example.com",
      subject: "[GitHub] Security Alert: New SSH key added to your profile",
      date: new Date(Date.now() - 220 * 60 * 1000).toUTCString(),
      snippet: "An active SSH security certificate was successfully authorized on your main account. Review details to confirm identity.",
      body: "We are notifying you that an active SSH credential keyset was uploaded to user account profile on June 04. Location: Dublin, IE. Device: Linux machine. If this was not you, please audit your repository permissions or remove the key immediately."
    },
    {
      id: "sim_msg_safe_005",
      from: "Team Lead <sarah.jenkins@company-internal.com>",
      to: "user@example.com",
      subject: "Weekly sync meeting agenda & Q2 team deliverables",
      date: new Date(Date.now() - 420 * 60 * 1000).toUTCString(),
      snippet: "Hey team, let's assemble on Monday for our engineering weekly sync. Read inside for milestones and status reports.",
      body: "Hi all, hoping everyone had an excellent week. For Monday's weekly sync, let's discuss our progress on the Gemini Threat Scanner applet integration. Sarah will summarize our user feedback. See you then!"
    }
  ];

  let messages: any[] = [];
  let isSimulated = !googleAccessToken || googleAccessToken === "simulated" || googleAccessToken === "mock";

  if (!isSimulated) {
    try {
      // 1. Fetch latest emails from Google Gmail API
      const listUrl = "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=8";
      const gmailListRes = await fetch(listUrl, {
        headers: { Authorization: `Bearer ${googleAccessToken}` },
      });

      if (gmailListRes.ok) {
        const listData = await gmailListRes.json();
        messages = listData.messages || [];
      } else {
        console.warn("Gmail API listing failure, falling back to simulated sandbox feed.");
        isSimulated = true;
      }
    } catch (err) {
      console.warn("Gmail API connection error, falling back to simulated sandbox feed:", err);
      isSimulated = true;
    }
  }

  if (isSimulated) {
    messages = simulatedMails.map(m => ({ id: m.id }));
  }

  try {
    const scannedReports = [];

    // 2. Load stored customized rules for this user from Firestore
    const rulesSnap = await db.collection("users").doc(customAuthUID).collection("rules").get();
    const activeRules: any[] = rulesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Helper to extract message payload headers
    const getHeader = (headers: any[], name: string) => {
      const found = headers?.find(h => h.name?.toLowerCase() === name.toLowerCase());
      return found ? found.value : "";
    };

    // Helper to decode base64 bodies recursively
    const getBodyContent = (payload: any): string => {
      if (!payload) return "";
      if (payload.body && payload.body.data) {
        const cleanBase64 = payload.body.data.replace(/-/g, "+").replace(/_/g, "/");
        return Buffer.from(cleanBase64, "base64").toString("utf-8");
      }
      if (payload.parts) {
        for (const part of payload.parts) {
          if (part.mimeType === "text/plain" && part.body && part.body.data) {
            const cleanBase64 = part.body.data.replace(/-/g, "+").replace(/_/g, "/");
            return Buffer.from(cleanBase64, "base64").toString("utf-8");
          }
          if (part.parts) {
            const nestedBody = getBodyContent(part);
            if (nestedBody) return nestedBody;
          }
        }
      }
      return "";
    };

    // Keep list of existing Gmail Labels to prevent redundant creations
    let existingLabels: any[] = [];
    if (!isSimulated) {
      try {
        const labelsRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/labels", {
          headers: { Authorization: `Bearer ${googleAccessToken}` },
        });
        if (labelsRes.ok) {
          const labelsData = await labelsRes.json();
          existingLabels = labelsData.labels || [];
        }
      } catch (labelsErr) {
        console.warn("Could not query labels", labelsErr);
      }
    }

    for (const msg of messages) {
      const emailDocRef = db.collection("users").doc(customAuthUID).collection("emails").doc(msg.id);
      const emailSnap = await emailDocRef.get();

      if (emailSnap.exists) {
        // Already processed and kept in Firestore cache!
        scannedReports.push(emailSnap.data());
        continue;
      }

      let fromHeader = "";
      let toHeader = "";
      let subjectHeader = "";
      let dateHeader = "";
      let snippet = "";
      let bodyText = "";

      if (isSimulated) {
        const matchingMail = simulatedMails.find(m => m.id === msg.id);
        if (!matchingMail) continue;
        fromHeader = matchingMail.from;
        toHeader = matchingMail.to;
        subjectHeader = matchingMail.subject;
        dateHeader = matchingMail.date;
        snippet = matchingMail.snippet;
        bodyText = matchingMail.body;
      } else {
        // Fetch detail message
        const detailUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`;
        const msgRes = await fetch(detailUrl, {
          headers: { Authorization: `Bearer ${googleAccessToken}` },
        });

        if (!msgRes.ok) continue;
        const msgData = await msgRes.json();

        const headers = msgData.payload?.headers || [];
        fromHeader = getHeader(headers, "From");
        toHeader = getHeader(headers, "To");
        subjectHeader = getHeader(headers, "Subject") || "(No Subject)";
        dateHeader = getHeader(headers, "Date");
        snippet = msgData.snippet || "";
        bodyText = getBodyContent(msgData.payload) || snippet;
      }

      // Ask Gemini to scan this particular email body
      const riskPrompt = `Please analyze the security and safety posture of this email inbox item:
From: ${fromHeader}
To: ${toHeader}
Subject: ${subjectHeader}
Date: ${dateHeader}
Snippet: ${snippet}
Message content:
${bodyText}

Produce a complete audit report strictly matching the JSON schema requested.`;

      const aiResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: riskPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              spamScore: { type: Type.INTEGER },
              phishingScore: { type: Type.INTEGER },
              threatScore: { type: Type.INTEGER },
              confidenceScore: { type: Type.INTEGER },
              riskLevel: { type: Type.STRING },
              classification: { type: Type.STRING },
              explanation: { type: Type.STRING },
              riskFactors: { type: Type.ARRAY, items: { type: Type.STRING } },
              recommendedAction: { type: Type.STRING },
            },
            required: [
              "spamScore",
              "phishingScore",
              "threatScore",
              "confidenceScore",
              "riskLevel",
              "classification",
              "explanation",
              "riskFactors",
              "recommendedAction",
            ],
          },
        },
      });

      const securityResult = JSON.parse(aiResponse.text.trim());
      const classKey = securityResult.classification?.toLowerCase() || "";
      const appliedLabels: string[] = [];

      // 3. APPLY RULES IN REAL TIME (Gmail label modifications)
      const matchedRule = activeRules.find(r => r.active && r.emailType?.toLowerCase() === classKey);

      if (matchedRule) {
        try {
          const ruleAction = matchedRule.action;
          const labelName = matchedRule.labelName || `SecureBox/${securityResult.classification}`;

          if (ruleAction === "label") {
            let labelId = "simulated_label_id";
            if (!isSimulated) {
              // Find or create label ID in Gmail
              const foundLabel = existingLabels.find(l => l.name?.toLowerCase() === labelName.toLowerCase());
              labelId = foundLabel?.id || "";
              
              if (!labelId) {
                const createLabelRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/labels", {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${googleAccessToken}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    name: labelName,
                    labelListVisibility: "labelShow",
                    messageListVisibility: "show",
                  }),
                });

                if (createLabelRes.ok) {
                  const newLabel = await createLabelRes.json();
                  labelId = newLabel.id;
                  existingLabels.push(newLabel);
                }
              }

              if (labelId) {
                // Apply this created Google label onto real active mail
                await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}/modify`, {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${googleAccessToken}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    addLabelIds: [labelId],
                    removeLabelIds: [],
                  }),
                });
              }
            }

            if (labelId || isSimulated) {
              appliedLabels.push(labelName);

              // Log trigger audit
              await db.collection("users").doc(customAuthUID).collection("activity").add({
                id: Math.random().toString(36).substring(2, 11),
                userId: customAuthUID,
                action: `Rule Triggered: Label "${labelName}" applied onto ${isSimulated ? "sandbox-simulated" : "threat"} email "${subjectHeader}" from ${fromHeader}`,
                type: "rules",
                timestamp: new Date().toISOString(),
              });
            }
          } else if (ruleAction === "archive") {
            if (!isSimulated) {
              await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}/modify`, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${googleAccessToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  addLabelIds: [],
                  removeLabelIds: ["INBOX"],
                }),
              });
            }
            appliedLabels.push("Archived");
            await db.collection("users").doc(customAuthUID).collection("activity").add({
              id: Math.random().toString(36).substring(2, 11),
              userId: customAuthUID,
              action: `Rule Triggered: Auto-Archived ${isSimulated ? "sandbox-simulated" : "threat"} email "${subjectHeader}"`,
              type: "rules",
              timestamp: new Date().toISOString(),
            });
          } else if (ruleAction === "mark_read") {
            if (!isSimulated) {
              await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}/modify`, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${googleAccessToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  addLabelIds: [],
                  removeLabelIds: ["UNREAD"],
                }),
              });
            }
            appliedLabels.push("Marked Read");
            await db.collection("users").doc(customAuthUID).collection("activity").add({
              id: Math.random().toString(36).substring(2, 11),
              userId: customAuthUID,
              action: `Rule Triggered: Marked ${isSimulated ? "sandbox-simulated" : "threat"} email "${subjectHeader}" as Read`,
              type: "rules",
              timestamp: new Date().toISOString(),
            });
          } else if (ruleAction === "move_trash") {
            if (!isSimulated) {
              await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}/trash`, {
                method: "POST",
                headers: { Authorization: `Bearer ${googleAccessToken}` },
              });
            }
            appliedLabels.push("Trashed");
            await db.collection("users").doc(customAuthUID).collection("activity").add({
              id: Math.random().toString(36).substring(2, 11),
              userId: customAuthUID,
              action: `Rule Triggered: Moved ${isSimulated ? "sandbox-simulated" : "threat"} email "${subjectHeader}" to Trash`,
              type: "rules",
              timestamp: new Date().toISOString(),
            });
          }
        } catch (ruleError) {
          console.error("Failed to execute inbox organization actions:", ruleError);
        }
      }

      // Compile output document
      const docPayload = {
        id: msg.id,
        userId: customAuthUID,
        from: fromHeader,
        to: toHeader,
        subject: subjectHeader,
        date: dateHeader || new Date().toISOString(),
        snippet: snippet,
        spamScore: Number(securityResult.spamScore ?? 0),
        phishingScore: Number(securityResult.phishingScore ?? 0),
        threatScore: Number(securityResult.threatScore ?? 0),
        confidenceScore: Number(securityResult.confidenceScore ?? 85),
        riskLevel: securityResult.riskLevel || "Safe",
        explanation: securityResult.explanation || "No details provided.",
        riskFactors: securityResult.riskFactors || [],
        recommendedAction: securityResult.recommendedAction || "None",
        classification: securityResult.classification || "Personal",
        appliedGmailLabels: appliedLabels,
        scannedAt: new Date().toISOString(),
      };

      // Set inside Firestore collection for persistent tracking
      await emailDocRef.set(docPayload);

      // Create log trigger log entry
      await db.collection("users").doc(customAuthUID).collection("activity").add({
        id: Math.random().toString(36).substring(2, 11),
        userId: customAuthUID,
        action: `Automatic email scan performed: Flagged "${subjectHeader}" from ${fromHeader} as ${securityResult.riskLevel} (${securityResult.classification})`,
        type: "security",
        timestamp: new Date().toISOString(),
      });

      scannedReports.push(docPayload);
    }

    res.json({ success: true, reports: scannedReports });
  } catch (error: any) {
    console.error("Gmail sync error:", error);
    res.status(500).json({ error: "Failed to securely parse and sync Gmail messages with Gemini AI." });
  }
});

// Vite middleware development / production handler
async function startViteMiddleware() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Skip Port Listener in serverless platforms like Vercel to avoid startup timeouts
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`[SecureBox Server] Server running securely inside sandbox on http://localhost:${PORT}`);
    });
  }
}

startViteMiddleware();

export default app;
