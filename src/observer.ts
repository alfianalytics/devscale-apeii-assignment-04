import { LensClient } from "@anvia/lens";
import "dotenv/config";

export const lens = new LensClient({
  baseUrl: process.env.ANVIA_LENS_BASE_URL || "http://localhost",
  publicKey: process.env.ANVIA_LENS_PUBLIC_KEY!,
  secretKey: process.env.ANVIA_LENS_SECRET_KEY!,
  serviceName: "research-agent",
});
