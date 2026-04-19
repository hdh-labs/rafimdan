const MAX_DIMENSION = 1920
const JPEG_QUALITY = 0.85

const EXIF_TO_DEG: Record<number, number> = { 1: 0, 3: 180, 6: 90, 8: 270 }

export async function readExifOrientation(file: File): Promise<number> {
  if (!file.type.includes("jpeg") && !file.type.includes("jpg")) return 1
  try {
    const buffer = await file.arrayBuffer()
    const view = new DataView(buffer)
    if (view.getUint16(0) !== 0xffd8) return 1

    let offset = 2
    while (offset < view.byteLength - 2) {
      const marker = view.getUint16(offset)
      if (marker === 0xffe1) {
        const exifStart = offset + 4
        if (view.byteLength < exifStart + 6) break
        if (view.getUint32(exifStart) !== 0x45786966) break // "Exif"

        const tiffStart = exifStart + 6
        const littleEndian = view.getUint16(tiffStart) === 0x4949
        const ifdOffset = tiffStart + view.getUint32(tiffStart + 4, littleEndian)
        if (ifdOffset >= view.byteLength) break
        const entries = view.getUint16(ifdOffset, littleEndian)

        for (let i = 0; i < entries; i++) {
          const entryOffset = ifdOffset + 2 + i * 12
          if (entryOffset + 12 > view.byteLength) break
          if (view.getUint16(entryOffset, littleEndian) === 0x0112) {
            return view.getUint16(entryOffset + 8, littleEndian)
          }
        }
        break
      }
      if ((marker & 0xff00) !== 0xff00) break
      offset += 2 + view.getUint16(offset + 2)
    }
  } catch {
    // EXIF okunamazsa yön düzeltme yapma
  }
  return 1
}

export async function correctAndCompress(
  file: File,
  manualDeg: number = 0,
): Promise<{ blob: Blob; url: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      readExifOrientation(file).then((exifOrientation) => {
        const exifDeg = EXIF_TO_DEG[exifOrientation] ?? 0
        const totalDeg = (exifDeg + manualDeg) % 360
        const swap = totalDeg === 90 || totalDeg === 270

        let imgW = img.naturalWidth
        let imgH = img.naturalHeight

        if (imgW > MAX_DIMENSION || imgH > MAX_DIMENSION) {
          if (imgW >= imgH) {
            imgH = Math.round((imgH * MAX_DIMENSION) / imgW)
            imgW = MAX_DIMENSION
          } else {
            imgW = Math.round((imgW * MAX_DIMENSION) / imgH)
            imgH = MAX_DIMENSION
          }
        }

        const canvas = document.createElement("canvas")
        canvas.width = swap ? imgH : imgW
        canvas.height = swap ? imgW : imgH

        const ctx = canvas.getContext("2d")!
        ctx.translate(canvas.width / 2, canvas.height / 2)
        ctx.rotate((totalDeg * Math.PI) / 180)
        ctx.drawImage(img, -imgW / 2, -imgH / 2, imgW, imgH)

        canvas.toBlob(
          (blob) => {
            if (!blob) { reject(new Error("Canvas toBlob failed")); return }
            resolve({ blob, url: URL.createObjectURL(blob) })
          },
          "image/jpeg",
          JPEG_QUALITY,
        )
      })
    }

    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Image load failed")) }
    img.src = objectUrl
  })
}
