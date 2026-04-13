/**
 * Google API JWT authentication helper.
 * Shared by Google Drive and Google Indexing API modules.
 * Uses the service account with Domain-Wide Delegation.
 */

export async function getGoogleAccessToken(
  clientEmail: string,
  privateKey: string,
  scope: string,
  impersonateEmail?: string
): Promise<string> {
  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);

  const claimPayload: Record<string, unknown> = {
    iss: clientEmail,
    scope,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  if (impersonateEmail) {
    claimPayload.sub = impersonateEmail;
  }

  const claim = btoa(JSON.stringify(claimPayload));

  // Import the private key and sign
  const key = privateKey.replace(/\\n/g, "\n");
  const keyData = key
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
  const binaryKey = Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const encoder = new TextEncoder();
  const signatureInput = encoder.encode(`${header}.${claim}`);
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    signatureInput
  );
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const jwt = `${header}.${claim}.${signatureB64}`;

  // Exchange JWT for access token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    throw new Error(
      `Failed to get Google access token: ${JSON.stringify(tokenData)}`
    );
  }

  return tokenData.access_token;
}
