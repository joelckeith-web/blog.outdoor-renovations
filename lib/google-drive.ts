/**
 * Google Drive API client for fetching client photos.
 * Uses service account with DWD to access shared Drive folders.
 */

import { getGoogleAccessToken } from "./google-auth";

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.readonly";

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: string;
  modifiedTime: string;
  imageMediaMetadata?: {
    width: number;
    height: number;
  };
}

export interface DriveFolder {
  id: string;
  name: string;
}

async function getDriveToken(): Promise<string> {
  const clientEmail = process.env.GOOGLE_DRIVE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY;
  const impersonateEmail = process.env.GOOGLE_DRIVE_IMPERSONATE_EMAIL;

  if (!clientEmail || !privateKey) {
    throw new Error("Google Drive credentials not configured");
  }

  return getGoogleAccessToken(
    clientEmail,
    privateKey,
    DRIVE_SCOPE,
    impersonateEmail || undefined
  );
}

/**
 * List subfolders in a Drive folder.
 */
export async function listDriveSubfolders(
  folderId: string
): Promise<DriveFolder[]> {
  const token = await getDriveToken();

  const query = encodeURIComponent(
    `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
  );
  const fields = encodeURIComponent("files(id,name)");

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&pageSize=100`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    throw new Error(`Drive API error listing folders: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * List image files in a Drive folder.
 */
export async function listDrivePhotos(
  folderId: string
): Promise<DriveFile[]> {
  const token = await getDriveToken();

  const query = encodeURIComponent(
    `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`
  );
  const fields = encodeURIComponent(
    "files(id,name,mimeType,size,modifiedTime,imageMediaMetadata)"
  );

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&pageSize=100`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    throw new Error(`Drive API error listing photos: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Download a file's content from Drive.
 */
export async function downloadDriveFile(
  fileId: string
): Promise<ArrayBuffer> {
  const token = await getDriveToken();

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    throw new Error(`Drive API error downloading file: ${res.status} ${await res.text()}`);
  }

  return res.arrayBuffer();
}
