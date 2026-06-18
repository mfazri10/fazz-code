import { serve } from "inngest/next";

import { fixErrors, generateApp, inngest } from "@/lib/inngest";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [generateApp, fixErrors],
});
