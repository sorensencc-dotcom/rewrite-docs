# Secret Management Guide

Security best practices for storing and managing sensitive credentials.

---

## ⚠️ Risk Assessment

**CRITICAL:** Google OAuth2 credentials (clientSecret, refreshToken) stored in plaintext JSON are a **data loss risk**.

- If config.json is committed to git, credentials are exposed in commit history (permanent)
- If config.json is backed up, credentials are exposed in backups
- If config.json is copied, credentials are exposed to anyone with file access
- If daemon process is compromised, all credentials are accessible

**Recommended:** Move secrets to environment variables or encrypted vault.

---

## Method 1: Environment Variables (Simple)

### Setup

```bash
# Set environment variables before running daemon
set DRIVE_CLIENT_ID=your-client-id-here
set DRIVE_CLIENT_SECRET=your-client-secret-here
set DRIVE_REFRESH_TOKEN=your-refresh-token-here

# Or in PowerShell
$env:DRIVE_CLIENT_ID = "your-client-id-here"
$env:DRIVE_CLIENT_SECRET = "your-client-secret-here"
$env:DRIVE_REFRESH_TOKEN = "your-refresh-token-here"
```

### Config File

```json
{
  "drive": {
    "clientId": "PLACEHOLDER",
    "clientSecret": "PLACEHOLDER",
    "refreshToken": "PLACEHOLDER"
  }
}
```

### Windows Task Scheduler

Create task with environment variables set:

```powershell
$taskAction = New-ScheduledTaskAction `
  -Execute "C:\Program Files\nodejs\node.exe" `
  -Argument "C:\dev\scripts\mailbox-intake-daemon\dist\index.js" `
  -WorkingDirectory "C:\dev\scripts\mailbox-intake-daemon" `
  -Environment @{
    'DRIVE_CLIENT_ID' = 'your-client-id-here';
    'DRIVE_CLIENT_SECRET' = 'your-client-secret-here';
    'DRIVE_REFRESH_TOKEN' = 'your-refresh-token-here';
  }

Register-ScheduledTask `
  -TaskName "Mailbox Intake Daemon" `
  -Action $taskAction `
  -Trigger (New-ScheduledTaskTrigger -AtStartup) `
  -RunLevel Highest
```

### Windows Service (NSSM)

```bash
nssm install "MailboxIntakeDaemon" "C:\Program Files\nodejs\node.exe" `
  "C:\dev\scripts\mailbox-intake-daemon\dist\index.js"

nssm set "MailboxIntakeDaemon" AppEnvironmentExtra `
  "DRIVE_CLIENT_ID=your-client-id-here"
nssm set "MailboxIntakeDaemon" AppEnvironmentExtra `
  "DRIVE_CLIENT_SECRET=your-client-secret-here"
nssm set "MailboxIntakeDaemon" AppEnvironmentExtra `
  "DRIVE_REFRESH_TOKEN=your-refresh-token-here"

net start "MailboxIntakeDaemon"
```

### Advantages

- ✅ Simple, no additional tools
- ✅ Platform standard
- ✅ Credentials not in files

### Disadvantages

- ❌ Visible in process list (if not careful)
- ❌ Visible in Task Scheduler if viewed
- ❌ Not encrypted at rest

---

## Method 2: Windows Credential Manager (Medium)

### Setup

```powershell
# Store credentials in Windows Credential Manager
cmdkey /add:"MailboxIntakeDaemon:drive" /user:"service-account" /pass:"your-client-id-here"

# Or programmatically
$credential = New-Object System.Management.Automation.PSCredential (
  "service-account",
  (ConvertTo-SecureString "your-client-secret-here" -AsPlainText -Force)
)
```

### Retrieve in Node.js

Use a native module to read from Credential Manager:

```typescript
const credentials = require('windows-credential-manager');
const driveCreds = credentials.getCredential('MailboxIntakeDaemon:drive');
```

### Advantages

- ✅ OS-level encryption
- ✅ Credentials not in files

### Disadvantages

- ❌ Windows-only
- ❌ Requires native module compilation
- ❌ More complex setup

---

## Method 3: Azure Key Vault (Advanced)

For production deployments with Azure infrastructure.

### Setup

```bash
# Create Key Vault
az keyvault create --name "mailbox-intake-kv" --resource-group "rg"

# Store secrets
az keyvault secret set --vault-name "mailbox-intake-kv" `
  --name "drive-client-id" --value "your-client-id"
az keyvault secret set --vault-name "mailbox-intake-kv" `
  --name "drive-client-secret" --value "your-client-secret"
az keyvault secret set --vault-name "mailbox-intake-kv" `
  --name "drive-refresh-token" --value "your-refresh-token"
```

### Retrieve in Node.js

```typescript
import { SecretClient } from '@azure/keyvault-secrets';
import { DefaultAzureCredential } from '@azure/identity';

const credential = new DefaultAzureCredential();
const client = new SecretClient('https://mailbox-intake-kv.vault.azure.net/', credential);

const clientId = await client.getSecret('drive-client-id');
const clientSecret = await client.getSecret('drive-client-secret');
const refreshToken = await client.getSecret('drive-refresh-token');
```

### Advantages

- ✅ Enterprise-grade encryption
- ✅ Audit logging
- ✅ Access control + RBAC
- ✅ Secrets never on disk

### Disadvantages

- ❌ Requires Azure subscription
- ❌ Network latency (API calls)
- ❌ Additional cost

---

## Method 4: HashiCorp Vault (Advanced)

For on-premises or hybrid deployments.

### Setup

```bash
# Initialize Vault and store secrets
vault login

vault kv put secret/mailbox-intake \
  drive_client_id="your-client-id" \
  drive_client_secret="your-client-secret" \
  drive_refresh_token="your-refresh-token"
```

### Retrieve in Node.js

```typescript
import VaultClient from 'node-vault';

const vault = new VaultClient({
  endpoint: 'http://127.0.0.1:8200',
  token: process.env.VAULT_TOKEN,
});

const secret = await vault.read('secret/mailbox-intake');
const { drive_client_id, drive_client_secret, drive_refresh_token } = secret.data.data;
```

### Advantages

- ✅ On-premises option
- ✅ Audit logging
- ✅ Dynamic secrets (if needed)
- ✅ Access control + policies

### Disadvantages

- ❌ Requires Vault infrastructure
- ❌ Network dependency

---

## Recommended Path (by Environment)

### Development

**Use:** Environment Variables

```bash
npm start
# Credentials passed via env vars
```

### Staging

**Use:** Environment Variables + Windows Task Scheduler

```powershell
# Task set with env vars
Register-ScheduledTask "Mailbox Intake Daemon Staging" ...
```

### Production

**Use:** Azure Key Vault (if available) OR Windows Credential Manager

```typescript
// Retrieve from Azure Key Vault at startup
const credentials = await getSecretsFromKeyVault();
```

---

## Secure Credential Rotation

### Google OAuth2 Refresh Token

Refresh tokens expire or can be revoked. Monitor for:

```bash
# Error logs for 401 Unauthorized
grep "401 Unauthorized" logs/DriveUploader.log

# Re-authenticate if needed
# Generate new refresh token via OAuth2 consent flow
```

### Automated Rotation (Future)

```typescript
// Monitor token expiry
if (tokenExpiredAt < Date.now() + 7 * 24 * 60 * 60 * 1000) {
  // 1 week until expiry
  logger.warn('OAuth2 refresh token expiring soon');
  // Alert ops team, trigger re-authentication
}
```

---

## Audit & Monitoring

### Log Sanitization

**NEVER log credentials:**

```typescript
// ❌ BAD
logger.error(`Auth failed: ${error.message}`);
// Message might contain token

// ✅ GOOD
logger.error('Drive API authentication failed');
// No sensitive data
```

### Secrets Audit Trail

Track who accesses secrets:

```bash
# Azure Key Vault
az monitor diagnostic-settings create \
  --resource /subscriptions/.../vaults/mailbox-intake-kv \
  --name key-vault-audit \
  --logs '[{"category":"AuditEvent","enabled":true}]'

# Windows Credential Manager
# Use Group Policy Auditing (gpedit.msc)
# Enable: Computer Config > Policies > Windows Settings > Security Settings > Audit Policy
```

---

## Emergency Procedures

### Compromised Refresh Token

```bash
# 1. Immediately revoke in Google Cloud Console
# 2. Generate new refresh token
# 3. Update in vault/env/config
# 4. Restart daemon

# 5. Check audit logs for unauthorized uploads
# 6. Revert Drive changes if needed
```

### Credential Leak Detection

```bash
# 1. Scan git history for secrets
git log --all -S "client_secret" -- config.json

# 2. Revoke if found
# 3. Rewrite history (DANGEROUS - carefully!)
# 4. Rotate all credentials

# 5. Notify security team
```

### Recovery

```bash
# If credentials lost:
# 1. Regenerate OAuth2 credentials in Google Cloud Console
# 2. Re-authenticate user
# 3. Obtain new refresh token
# 4. Update daemon
# 5. Test Drive upload
```

---

## Compliance Checklist

- [ ] No secrets in config.json (or only placeholders)
- [ ] No secrets in git history
- [ ] No secrets in logs
- [ ] Secrets stored in vault/env vars
- [ ] Credentials rotated every 90 days
- [ ] Access to secrets audited
- [ ] Incident response plan documented
- [ ] Team trained on secret handling

---

## Tools & Libraries

| Tool | Use Case | Cost |
|------|----------|------|
| Environment Variables | Simple dev/staging | Free |
| Windows Credential Manager | Local Windows | Free |
| Azure Key Vault | Cloud + audit | $0.03/10k ops |
| HashiCorp Vault | On-premises | Free (OSS) |
| AWS Secrets Manager | AWS ecosystem | $0.40/secret/month |

---

## References

- [OWASP: Secrets Management](https://owasp.org/www-community/Sensitive_Data_Exposure)
- [Google Cloud: API Keys Best Practices](https://cloud.google.com/docs/authentication/external-identities)
- [Azure Key Vault: Best Practices](https://docs.microsoft.com/en-us/azure/key-vault/general/best-practices)
- [HashiCorp Vault: Documentation](https://www.vaultproject.io/docs)
