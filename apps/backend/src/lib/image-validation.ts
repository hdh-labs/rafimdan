export async function validateImageMagicBytes(file: File): Promise<boolean> {
  const buffer = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  const isWebp =
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
  const isGif = buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46;
  return isJpeg || isPng || isWebp || isGif;
}

export function getImageExtension(mimeType: string): string {
  if (mimeType === "image/jpeg") return "jpg";
  const sub = mimeType.split("/")[1];
  return sub ?? "jpg";
}
