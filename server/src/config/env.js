const { z } = require("zod");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().default("127.0.0.1"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  CLIENT_ORIGIN: z.string().url().default("http://127.0.0.1:5173"),
  ADMIN_ORIGIN: z.string().url().default("http://127.0.0.1:5174"),
  MONGODB_URI: z
    .string()
    .min(1, "MONGODB_URI is required")
    .refine(
      (value) => value.startsWith("mongodb://") || value.startsWith("mongodb+srv://"),
      "MONGODB_URI must start with mongodb:// or mongodb+srv://",
    ),
  MONGODB_DB_NAME: z.string().trim().min(1).default("room_rental_dev"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration.", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

module.exports = { env: parsed.data };
