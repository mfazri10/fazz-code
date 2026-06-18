import { Inngest } from "inngest";

// Create Inngest client
export const inngest = new Inngest({ id: "fazz-code" });

// Durable generation function
export const generateApp = inngest.createFunction(
  {
    id: "generate-app",
    name: "Generate App",
  },
  { event: "generation/requested" },
  // @ts-expect-error Inngest v4 createFunction handler type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ event, step }: any) => {
    const { prompt, model, projectId } = event.data;

    const plan = await step.run("plan", async () => {
      return { summary: "Plan created", files: [], components: [] };
    });

    const files = await step.run("generate", async () => {
      return [];
    });

    const review = await step.run("review", async () => {
      return { verdict: "approve", issues: [] };
    });

    return { plan, files, review };
  }
);

// Durable fix function
export const fixErrors = inngest.createFunction(
  {
    id: "fix-errors",
    name: "Fix Errors",
  },
  { event: "fix/requested" },
  // @ts-expect-error Inngest v4 createFunction handler type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ event, step }: any) => {
    const { errors, projectId } = event.data;

    const fixes = await step.run("fix", async () => {
      return [];
    });

    return { fixes };
  }
);
