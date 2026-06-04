export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  createdAt: string;
  lastLoginAt: string;
  protectionLevel: 'relaxed' | 'balanced' | 'strict' | 'enterprise';
  subscription: 'free' | 'superman' | 'batman';
}

export interface ScannedEmail {
  id: string;
  userId: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  snippet: string;
  spamScore: number;
  phishingScore: number;
  threatScore: number;
  confidenceScore: number;
  riskLevel: 'Safe' | 'Low Risk' | 'Medium Risk' | 'High Risk' | 'Critical';
  explanation: string;
  riskFactors: string[];
  recommendedAction: string;
  classification: 'Important' | 'Personal' | 'Work' | 'Newsletter' | 'Promotion' | 'Marketing' | 'Cold Outreach' | 'Spam' | 'Phishing' | 'Scam' | 'Suspicious';
  appliedGmailLabels: string[];
  scannedAt: string;
}

export interface AutomationRule {
  id: string;
  userId: string;
  emailType: 'newsletter' | 'promotion' | 'cold_outreach' | 'high_risk' | 'phishing' | 'scam' | 'suspicious' | 'important' | 'personal' | 'work';
  action: 'label' | 'archive' | 'mark_read' | 'move_trash' | 'warning';
  labelName: string;
  active: boolean;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  type: 'security' | 'connection' | 'rules' | 'system';
  timestamp: string;
}
