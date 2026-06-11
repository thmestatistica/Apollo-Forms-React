/**
 * Extrai o ID de uma URL do Google Drive.
 *
 * @param {string} url URL compartilhada do Google Drive.
 * @returns {string | null} ID do arquivo ou null.
 */
export function extractGoogleDriveFileId(url) {
  if (!url) return null;
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Determina o tipo do arquivo baseado no MIME Type.
 *
 * @param {string} mimeType MIME Type do arquivo.
 */
export function getFileType(mimeType) {
  if (!mimeType) return 'other';
  const type = mimeType.toLowerCase();
  if (type.startsWith('image/') || type === 'image') return 'image';
  if (type.startsWith('video/') || type === 'video') return 'video';
  if (type.startsWith('audio/') || type === 'audio') return 'audio';
  if (type === 'application/pdf' || type === 'pdf') return 'pdf';
  return 'other';
}

/**
 * Gera a URL ideal para exibição do arquivo.
 *
 * @param {string} driveUrl URL compartilhada do Google Drive.
 * @param {string} mimeType MIME Type do arquivo.
 */
export function getGoogleDrivePreviewUrl(driveUrl, mimeType) {
  const fileId = extractGoogleDriveFileId(driveUrl);

  if (!fileId) {
    return null;
  }

  const fileType = getFileType(mimeType);

  // Para imagens, o link uc?export=view funciona melhor em tags <img>
  // e evita problemas de frame-ancestors/CSP do Google.
  if (fileType === 'image') {
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }

  // Para os demais tipos (PDF, vídeo), o endpoint /preview é o ideal para iframes.
  return `https://drive.google.com/file/d/${fileId}/preview`;
}