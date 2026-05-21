import type { MetadataRoute } from "next";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

const INDEXABLE_HOSTS = new Set(["mcc-realtor-app.vercel.app"]);

export default async function robots(): Promise<MetadataRoute.Robots> {
  const h = await headers();
  const host = (h.get("host") || "").toLowerCase();
  const indexable = INDEXABLE_HOSTS.has(host);
  return {
    rules: indexable
      ? { userAgent: "*", allow: "/" }
      : { userAgent: "*", disallow: "/" },
  };
}
