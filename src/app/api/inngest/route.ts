import { serve } from "inngest/next";
import { inngest, generateApp, fixErrors } from "@/lib/inngest";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [generateApp, fixErrors],
});
