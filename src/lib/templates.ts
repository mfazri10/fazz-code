export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  files: Record<string, string>;
}

export const TEMPLATES: ProjectTemplate[] = [
  {
    id: "blank",
    name: "Blank Project",
    description: "Start from scratch with an empty project",
    icon: "📄",
    files: {},
  },
  {
    id: "landing",
    name: "Landing Page",
    description: "Modern landing page with hero, features, and CTA",
    icon: "🚀",
    files: {
      "src/app/page.tsx": `export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <h1 className="text-5xl font-bold tracking-tight">
          Build Something <span className="text-primary">Amazing</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-[600px]">
          Create beautiful web applications with the power of AI.
          Ship faster, build smarter.
        </p>
        <div className="mt-8 flex gap-3">
          <a href="#features" className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Get Started
          </a>
          <a href="#about" className="rounded-lg border px-6 py-3 text-sm font-medium hover:bg-accent">
            Learn More
          </a>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 bg-muted/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "Fast", desc: "Lightning-fast performance", icon: "⚡" },
              { title: "Beautiful", desc: "Stunning modern design", icon: "🎨" },
              { title: "Smart", desc: "AI-powered intelligence", icon: "🧠" },
            ].map((f) => (
              <div key={f.title} className="rounded-lg border bg-background p-6">
                <span className="text-3xl">{f.icon}</span>
                <h3 className="mt-3 text-lg font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}`,
      "src/app/layout.tsx": `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Landing Page",
  description: "A beautiful landing page",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}`,
      "src/app/globals.css": `@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #0a0a0a;
  --primary: #2563eb;
  --primary-foreground: #ffffff;
  --muted: #f5f5f5;
  --muted-foreground: #737373;
  --border: #e5e7eb;
  --destructive: #ef4444;
}

.dark {
  --background: #0a0a0a;
  --foreground: #fafafa;
  --primary: #3b82f6;
  --primary-foreground: #ffffff;
  --muted: #262626;
  --muted-foreground: #a3a3a3;
  --border: #262626;
  --destructive: #ef4444;
}

body {
  background: var(--background);
  color: var(--foreground);
}`,
    },
  },
  {
    id: "dashboard",
    name: "Admin Dashboard",
    description: "Dashboard with sidebar, stats cards, and charts",
    icon: "📊",
    files: {
      "src/app/page.tsx": `export default function Dashboard() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/30 p-4">
        <h2 className="text-lg font-bold mb-6">Dashboard</h2>
        <nav className="space-y-1">
          {["Overview", "Analytics", "Users", "Settings"].map((item) => (
            <a
              key={item}
              href="#"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
            >
              {item}
            </a>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-6">Overview</h1>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Users", value: "12,345", change: "+12%" },
            { label: "Revenue", value: "$45,678", change: "+8%" },
            { label: "Orders", value: "1,234", change: "+15%" },
            { label: "Conversion", value: "3.2%", change: "-0.4%" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
              <p className={\`text-xs mt-1 \${stat.change.startsWith("+") ? "text-green-600" : "text-red-600"}\`}>
                {stat.change} from last month
              </p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-lg border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "John Doe", email: "john@example.com", status: "Active" },
                { name: "Jane Smith", email: "jane@example.com", status: "Active" },
                { name: "Bob Wilson", email: "bob@example.com", status: "Inactive" },
              ].map((user) => (
                <tr key={user.name} className="border-b">
                  <td className="px-4 py-3 text-sm">{user.name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={\`inline-flex rounded-full px-2 py-0.5 text-xs \${
                      user.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                    }\`}>
                      {user.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}`,
      "src/app/layout.tsx": `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "A beautiful admin dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}`,
      "src/app/globals.css": `@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #0a0a0a;
  --muted: #f5f5f5;
  --muted-foreground: #737373;
  --border: #e5e7eb;
}

.dark {
  --background: #0a0a0a;
  --foreground: #fafafa;
  --muted: #262626;
  --muted-foreground: #a3a3a3;
  --border: #262626;
}

body {
  background: var(--background);
  color: var(--foreground);
}`,
    },
  },
  {
    id: "blog",
    name: "Blog",
    description: "Simple blog with post list and detail pages",
    icon: "📝",
    files: {
      "src/app/page.tsx": `const posts = [
  { slug: "hello-world", title: "Hello World", excerpt: "My first blog post", date: "2024-01-15" },
  { slug: "getting-started", title: "Getting Started", excerpt: "How to get started with Next.js", date: "2024-01-10" },
];

export default function Blog() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Blog</h1>
      <div className="space-y-6">
        {posts.map((post) => (
          <article key={post.slug} className="border-b pb-6">
            <a href={\`/posts/\${post.slug}\`} className="group">
              <h2 className="text-xl font-semibold group-hover:text-primary">{post.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">{post.date}</p>
              <p className="mt-2 text-muted-foreground">{post.excerpt}</p>
            </a>
          </article>
        ))}
      </div>
    </main>
  );
}`,
      "src/app/layout.tsx": `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Blog",
  description: "A simple blog",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}`,
      "src/app/globals.css": `@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #0a0a0a;
  --primary: #2563eb;
  --muted: #f5f5f5;
  --muted-foreground: #737373;
  --border: #e5e7eb;
}

.dark {
  --background: #0a0a0a;
  --foreground: #fafafa;
  --primary: #3b82f6;
  --muted: #262626;
  --muted-foreground: #a3a3a3;
  --border: #262626;
}

body {
  background: var(--background);
  color: var(--foreground);
}`,
    },
  },
];
