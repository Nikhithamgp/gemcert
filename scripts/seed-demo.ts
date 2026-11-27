/**
 * Seeds clearly-labelled DEMO records for training and testing:
 *   npm run db:seed-demo
 *
 * DEMO certificates use the separate "DEMO" number prefix (never consuming the
 * real sequence), have isDemo=true, carry "DEMO" in the name, show a DEMO badge
 * on the public page and print with a DEMO watermark.
 *
 * Remove them later with:  npm run db:seed-demo -- --remove
 */
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { scriptClient } from "./db";
import { LocalStorage } from "../src/lib/storage/local";
import { S3Storage } from "../src/lib/storage/s3";
import type { ObjectStorage } from "../src/lib/storage/keys";
import { allocateCertificateNumber } from "../src/lib/certificates/number";
import { buildVerifyUrl } from "../src/lib/verify-url";

function storage(): ObjectStorage {
  if (process.env.STORAGE_DRIVER === "s3") {
    return new S3Storage({
      endpoint: process.env.S3_ENDPOINT || undefined,
      region: process.env.S3_REGION || "auto",
      bucket: process.env.S3_BUCKET!,
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    });
  }
  return new LocalStorage(process.env.LOCAL_STORAGE_DIR || "./storage");
}

async function demoImage(colour: string): Promise<Buffer> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800">
    <defs><radialGradient id="g" cx="40%" cy="35%" r="70%">
      <stop offset="0%" stop-color="#ffffff"/><stop offset="45%" stop-color="${colour}"/><stop offset="100%" stop-color="#111"/>
    </radialGradient></defs>
    <rect width="800" height="800" fill="#f3f4f6"/>
    <polygon points="400,140 620,300 540,640 260,640 180,300" fill="url(#g)" stroke="#333" stroke-width="4"/>
    <text x="400" y="740" font-size="72" font-family="Arial" font-weight="bold" text-anchor="middle" fill="#9333ea">DEMO</text>
  </svg>`;
  return sharp(Buffer.from(svg)).jpeg({ quality: 85 }).toBuffer();
}

const DEMOS = [
  {
    specimenName: "DEMO – Yellow Sapphire (sample record)",
    weightCt: "2.450",
    colour: "Yellow",
    shapeCut: "Oval, mixed cut",
    hardness: "9",
    specificGravity: "3.99 – 4.01",
    refractiveIndex: "1.762 – 1.770",
    lengthMm: "8.10",
    widthMm: "6.20",
    depthMm: "4.05",
    treatment: "Not tested",
    comments: "DEMO record for training. Not a real gemstone certificate.",
    colourHex: "#facc15",
    status: "PUBLISHED" as const,
  },
  {
    specimenName: "DEMO – Blue Synthetic Stone (voided sample)",
    weightCt: "1.200",
    colour: "Blue",
    shapeCut: "Cushion, mixed cut",
    hardness: "9",
    specificGravity: "4.00",
    refractiveIndex: "1.762 – 1.770",
    treatment: "Undetermined",
    comments: "DEMO record showing how a voided certificate appears.",
    colourHex: "#2563eb",
    status: "VOIDED" as const,
  },
  {
    specimenName: "DEMO – Green Stone (draft sample)",
    weightCt: "3.050",
    colour: "Green",
    shapeCut: "Emerald cut",
    hardness: "7.5 – 8",
    colourHex: "#16a34a",
    status: "DRAFT" as const,
  },
];

async function main() {
  const db = scriptClient();
  const store = storage();
  try {
    if (process.argv.includes("--remove")) {
      const demos = await db.certificate.findMany({ where: { isDemo: true } });
      for (const d of demos) if (d.imageObjectKey) await store.delete(d.imageObjectKey).catch(() => undefined);
      const ids = demos.map((d) => d.id);
      await db.$transaction([
        db.certificate.updateMany({ where: { id: { in: ids } }, data: { supersededById: null, revisionOfId: null } }),
        db.auditLog.deleteMany({ where: { certificateId: { in: ids } } }),
        db.certificate.deleteMany({ where: { id: { in: ids } } }),
      ]);
      console.log(`Removed ${ids.length} DEMO certificates. (DEMO numbers are not reused.)`);
      return;
    }

    const admin = await db.user.findFirst({ where: { role: "ADMIN", active: true }, orderBy: { createdAt: "asc" } });
    if (!admin) throw new Error("No admin user found. Run `npm run admin:bootstrap` first.");
    const settings = await db.labSettings.findUnique({ where: { id: 1 } });
    const base = (settings?.publicBaseUrl || process.env.PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

    for (const demo of DEMOS) {
      const { colourHex, status, ...fields } = demo;
      const key = `certificates/${randomUUID()}.jpg`;
      await store.put(key, await demoImage(colourHex), "image/jpeg");
      await db.$transaction(async (tx) => {
        let extra = {};
        if (status !== "DRAFT") {
          const issuedAt = new Date();
          const certificateNumber = await allocateCertificateNumber(tx, "DEMO", issuedAt.getUTCFullYear());
          extra = {
            certificateNumber,
            issuedAt,
            verifyUrl: buildVerifyUrl(base, certificateNumber),
            ...(status === "VOIDED" ? { voidedAt: new Date(), voidReason: "DEMO: example of a voided certificate" } : {}),
          };
        }
        const cert = await tx.certificate.create({
          data: { ...fields, status, isDemo: true, imageObjectKey: key, createdById: admin.id, ...extra },
        });
        await tx.auditLog.create({
          data: { action: "certificate.seed_demo", actorId: admin.id, certificateId: cert.id, after: { status } },
        });
        console.log(`  ${status.padEnd(9)} ${cert.certificateNumber ?? "(draft)"}  ${cert.specimenName}`);
      });
    }
    console.log("DEMO records created.");
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
