const { z } = require("zod");

const emptyToUndefined = (val) => (typeof val === "string" && val.trim() === "" ? undefined : val);

const optionalBool = z.preprocess((val) => {
  if (val === undefined || val === null || String(val).trim() === "") return undefined;
  const normalized = String(val).trim().toLowerCase();
  if (["true", "1", "yes"].includes(normalized)) return true;
  if (["false", "0", "no"].includes(normalized)) return false;
  return val;
}, z.boolean().optional());

const trustProxySchema = z.preprocess((val) => {
  if (val === undefined || val === null || String(val).trim() === "") return 0;
  const normalized = String(val).trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  const asNum = Number(normalized);
  if (Number.isInteger(asNum) && asNum >= 0 && asNum <= 10) return asNum;
  return val;
}, z.union([z.boolean(), z.number().int().min(0).max(10)]));

const originListSchema = (defaultValue) =>
  z.string().default(defaultValue).transform((raw, ctx) => {
    const items = String(raw)
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    if (!items.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "At least one origin URL is required." });
      return z.NEVER;
    }
    const normalized = [];
    for (const item of items) {
      try {
        const url = new URL(item);
        if (!["http:", "https:"].includes(url.protocol)) {
          throw new Error("Invalid protocol");
        }
        if (!normalized.includes(url.origin)) {
          normalized.push(url.origin);
        }
      } catch {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Invalid origin URL: ${item}` });
        return z.NEVER;
      }
    }
    return normalized;
  });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().default("127.0.0.1"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  CLIENT_ORIGIN: originListSchema("http://127.0.0.1:5173"),
  ADMIN_ORIGIN: originListSchema("http://127.0.0.1:5174"),
  TRUST_PROXY: trustProxySchema,
  COOKIE_SECURE: optionalBool,
  COOKIE_SAMESITE: z.enum(["Strict", "Lax", "None"]).default("Strict"),
  MONGODB_URI: z
    .string()
    .min(1, "MONGODB_URI is required")
    .refine(
      (value) => value.startsWith("mongodb://") || value.startsWith("mongodb+srv://"),
      "MONGODB_URI must start with mongodb:// or mongodb+srv://",
    ),
  MONGODB_DB_NAME: z.string().trim().min(1).default("room_rental_dev"),
  UPLOAD_DIR: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),
  BACKUP_ROOT: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),
  ALERT_WEBHOOK_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
  IMAGE_STORAGE_DRIVER: z.enum(["local", "cloudinary"]).default("local"),
  CLOUDINARY_CLOUD_NAME: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),
  CLOUDINARY_API_KEY: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),
  CLOUDINARY_API_SECRET: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),
  CLOUDINARY_FOLDER: z.string().trim().min(1).default("room-rental-binh-thanh"),
  CLOUDINARY_API_BASE: z.preprocess(emptyToUndefined, z.string().url().optional()),
  GEMINI_API_KEY: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),
  GEMINI_MODEL: z.string().trim().min(1).default("gemini-2.5-flash"),
}).superRefine((data, ctx) => {
  const effectiveCookieSecure = data.COOKIE_SECURE ?? data.NODE_ENV === "production";
  if (data.COOKIE_SAMESITE === "None" && !effectiveCookieSecure) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["COOKIE_SAMESITE"],
      message: "COOKIE_SAMESITE=None requires COOKIE_SECURE=true or NODE_ENV=production.",
    });
  }
  if (data.IMAGE_STORAGE_DRIVER === "cloudinary") {
    if (!data.CLOUDINARY_CLOUD_NAME) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["CLOUDINARY_CLOUD_NAME"],
        message: "CLOUDINARY_CLOUD_NAME is required when IMAGE_STORAGE_DRIVER=cloudinary.",
      });
    }
    if (!data.CLOUDINARY_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["CLOUDINARY_API_KEY"],
        message: "CLOUDINARY_API_KEY is required when IMAGE_STORAGE_DRIVER=cloudinary.",
      });
    }
    if (!data.CLOUDINARY_API_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["CLOUDINARY_API_SECRET"],
        message: "CLOUDINARY_API_SECRET is required when IMAGE_STORAGE_DRIVER=cloudinary.",
      });
    }
  }
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration.", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const env = {
  ...parsed.data,
  CLIENT_ORIGIN: parsed.data.CLIENT_ORIGIN[0],
  CLIENT_ORIGINS: parsed.data.CLIENT_ORIGIN,
  ADMIN_ORIGIN: parsed.data.ADMIN_ORIGIN[0],
  ADMIN_ORIGINS: parsed.data.ADMIN_ORIGIN,
  COOKIE_SECURE_EFFECTIVE: parsed.data.COOKIE_SECURE ?? parsed.data.NODE_ENV === "production",
};

module.exports = { env };
