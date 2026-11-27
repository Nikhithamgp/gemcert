import QRCode from "qrcode";

// Error correction "M" (~15%) keeps modules large enough to scan from a small
// printed card while tolerating minor smudges. margin 4 = the standard quiet zone.
const OPTIONS = { errorCorrectionLevel: "M", margin: 4 } as const;

export function qrSvg(url: string, colour = "#000000"): Promise<string> {
  return QRCode.toString(url, { ...OPTIONS, type: "svg", color: { dark: colour, light: "#ffffff" } });
}

export function qrPngBuffer(url: string, width = 600): Promise<Buffer> {
  return QRCode.toBuffer(url, { ...OPTIONS, type: "png", width });
}

export function qrPngDataUrl(url: string, width = 600): Promise<string> {
  return QRCode.toDataURL(url, { ...OPTIONS, width });
}
