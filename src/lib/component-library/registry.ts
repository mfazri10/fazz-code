/**
 * Component Library Registry
 * Pre-built React components that can be inserted into projects.
 */

export interface LibraryComponent {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  code: string;
  dependencies: string[]; // shadcn/ui components needed
}

const LAYOUT_COMPONENTS: LibraryComponent[] = [
  {
    id: "hero-section",
    name: "Hero Section",
    category: "Layout",
    description: "Full-width hero with heading, subheading, and CTA buttons",
    icon: "🚀",
    dependencies: ["Button"],
    code: `export function HeroSection() {
  return (
    <section className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <h1 className="text-5xl font-bold tracking-tight">
        Build Something <span className="text-primary">Amazing</span>
      </h1>
      <p className="mt-4 text-lg text-muted-foreground max-w-[600px]">
        Create beautiful web applications with the power of AI. Ship faster, build smarter.
      </p>
      <div className="mt-8 flex gap-3">
        <Button size="lg">Get Started</Button>
        <Button variant="outline" size="lg">Learn More</Button>
      </div>
    </section>
  );
}`,
  },
  {
    id: "feature-grid",
    name: "Feature Grid",
    category: "Layout",
    description: "3-column grid with icons, titles, and descriptions",
    icon: "✨",
    dependencies: [],
    code: `export function FeatureGrid() {
  const features = [
    { icon: "⚡", title: "Fast", desc: "Lightning-fast performance" },
    { icon: "🎨", title: "Beautiful", desc: "Stunning modern design" },
    { icon: "🔒", title: "Secure", desc: "Enterprise-grade security" },
  ];

  return (
    <section className="py-20 px-4">
      <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {features.map((f) => (
          <div key={f.title} className="rounded-lg border p-6">
            <span className="text-3xl">{f.icon}</span>
            <h3 className="mt-3 text-lg font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}`,
  },
  {
    id: "stats-bar",
    name: "Stats Bar",
    category: "Layout",
    description: "Horizontal bar with statistics and labels",
    icon: "📊",
    dependencies: [],
    code: `export function StatsBar() {
  const stats = [
    { value: "10K+", label: "Users" },
    { value: "99.9%", label: "Uptime" },
    { value: "50M+", label: "Requests" },
    { value: "4.9★", label: "Rating" },
  ];

  return (
    <section className="py-12 px-4 bg-muted/50">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto text-center">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="text-3xl font-bold">{s.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}`,
  },
  {
    id: "testimonial-grid",
    name: "Testimonial Grid",
    category: "Layout",
    description: "Grid of testimonial cards with quotes",
    icon: "💬",
    dependencies: ["Card"],
    code: `export function TestimonialGrid() {
  const testimonials = [
    { name: "Alice", role: "CEO", quote: "This tool changed how we build products." },
    { name: "Bob", role: "Developer", quote: "Incredible developer experience." },
    { name: "Carol", role: "Designer", quote: "Beautiful defaults, easy to customize." },
  ];

  return (
    <section className="py-20 px-4">
      <h2 className="text-3xl font-bold text-center mb-12">What People Say</h2>
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {testimonials.map((t) => (
          <Card key={t.name} className="p-6">
            <p className="text-muted-foreground italic">"{t.quote}"</p>
            <div className="mt-4">
              <p className="font-semibold">{t.name}</p>
              <p className="text-sm text-muted-foreground">{t.role}</p>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}`,
  },
];

const NAVIGATION_COMPONENTS: LibraryComponent[] = [
  {
    id: "navbar-minimal",
    name: "Navbar Minimal",
    category: "Navigation",
    description: "Logo + links + CTA button, sticky, responsive",
    icon: "📌",
    dependencies: ["Button"],
    code: `export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <a href="/" className="text-xl font-bold">Brand</a>
        <div className="hidden md:flex items-center gap-6">
          <a href="/features" className="text-sm hover:text-primary">Features</a>
          <a href="/pricing" className="text-sm hover:text-primary">Pricing</a>
          <a href="/about" className="text-sm hover:text-primary">About</a>
        </div>
        <Button size="sm">Get Started</Button>
      </div>
    </nav>
  );
}`,
  },
  {
    id: "sidebar-nav",
    name: "Sidebar Navigation",
    category: "Navigation",
    description: "Collapsible sidebar with section groups",
    icon: "📋",
    dependencies: [],
    code: `export function SidebarNav() {
  const sections = [
    { title: "Main", items: ["Dashboard", "Analytics", "Reports"] },
    { title: "Settings", items: ["General", "Security", "Billing"] },
  ];

  return (
    <aside className="w-64 border-r h-screen p-4">
      <h2 className="text-lg font-bold mb-4">Menu</h2>
      {sections.map((section) => (
        <div key={section.title} className="mb-4">
          <p className="text-xs font-medium text-muted-foreground uppercase mb-2">{section.title}</p>
          {section.items.map((item) => (
            <a key={item} href="#" className="block rounded-md px-3 py-2 text-sm hover:bg-accent">
              {item}
            </a>
          ))}
        </div>
      ))}
    </aside>
  );
}`,
  },
];

const PRICING_COMPONENTS: LibraryComponent[] = [
  {
    id: "pricing-three-tier",
    name: "Pricing Three Tier",
    category: "Pricing",
    description: "3 pricing cards with highlighted recommended tier",
    icon: "💰",
    dependencies: ["Card", "Button"],
    code: `export function PricingSection() {
  const plans = [
    { name: "Basic", price: "$9", features: ["5 projects", "1GB storage", "Email support"], highlighted: false },
    { name: "Pro", price: "$29", features: ["Unlimited projects", "10GB storage", "Priority support", "API access"], highlighted: true },
    { name: "Enterprise", price: "$99", features: ["Everything in Pro", "100GB storage", "24/7 support", "Custom integrations"], highlighted: false },
  ];

  return (
    <section className="py-20 px-4">
      <h2 className="text-3xl font-bold text-center mb-4">Pricing</h2>
      <p className="text-center text-muted-foreground mb-12">Choose the plan that fits your needs</p>
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map((plan) => (
          <Card key={plan.name} className={\`p-6 \${plan.highlighted ? "border-primary shadow-lg" : ""}\`}>
            {plan.highlighted && <Badge className="mb-2">Recommended</Badge>}
            <h3 className="text-xl font-bold">{plan.name}</h3>
            <p className="text-3xl font-bold mt-2">{plan.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
            <ul className="mt-4 space-y-2">
              {plan.features.map((f) => (
                <li key={f} className="text-sm flex items-center gap-2">✓ {f}</li>
              ))}
            </ul>
            <Button className="mt-6 w-full" variant={plan.highlighted ? "default" : "outline"}>
              Get Started
            </Button>
          </Card>
        ))}
      </div>
    </section>
  );
}`,
  },
];

const DATA_DISPLAY_COMPONENTS: LibraryComponent[] = [
  {
    id: "stat-card",
    name: "Stat Card",
    category: "Data Display",
    description: "Individual stat card with icon, value, and trend",
    icon: "📈",
    dependencies: ["Card"],
    code: `export function StatCard({ label, value, trend }: { label: string; value: string; trend?: string }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {trend && (
        <p className={\`text-xs mt-1 \${trend.startsWith("+") ? "text-green-600" : "text-red-600"}\`}>
          {trend} from last month
        </p>
      )}
    </Card>
  );
}`,
  },
  {
    id: "activity-feed",
    name: "Activity Feed",
    category: "Data Display",
    description: "Vertical timeline with activity items",
    icon: "📰",
    dependencies: [],
    code: `export function ActivityFeed() {
  const activities = [
    { user: "Alice", action: "created a new project", time: "2 min ago" },
    { user: "Bob", action: "deployed to production", time: "1 hour ago" },
    { user: "Carol", action: "updated billing settings", time: "3 hours ago" },
  ];

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Recent Activity</h3>
      {activities.map((a, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
          <div>
            <p className="text-sm"><span className="font-medium">{a.user}</span> {a.action}</p>
            <p className="text-xs text-muted-foreground">{a.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
}`,
  },
];

const FORM_COMPONENTS: LibraryComponent[] = [
  {
    id: "contact-form",
    name: "Contact Form",
    category: "Forms",
    description: "Name, email, subject, message with validation",
    icon: "📧",
    dependencies: ["Button", "Input"],
    code: `export function ContactForm() {
  return (
    <form className="space-y-4 max-w-md">
      <h2 className="text-2xl font-bold">Contact Us</h2>
      <div>
        <label className="text-sm font-medium">Name</label>
        <Input placeholder="Your name" className="mt-1" />
      </div>
      <div>
        <label className="text-sm font-medium">Email</label>
        <Input type="email" placeholder="you@example.com" className="mt-1" />
      </div>
      <div>
        <label className="text-sm font-medium">Message</label>
        <textarea className="mt-1 w-full rounded-md border px-3 py-2 min-h-[100px]" placeholder="Your message" />
      </div>
      <Button type="submit" className="w-full">Send Message</Button>
    </form>
  );
}`,
  },
  {
    id: "login-form",
    name: "Login Form",
    category: "Forms",
    description: "Email + password with remember me and social login",
    icon: "🔐",
    dependencies: ["Button", "Input"],
    code: `export function LoginForm() {
  return (
    <div className="w-full max-w-sm">
      <h2 className="text-2xl font-bold text-center mb-6">Sign In</h2>
      <form className="space-y-4">
        <div>
          <label className="text-sm font-medium">Email</label>
          <Input type="email" placeholder="you@example.com" className="mt-1" />
        </div>
        <div>
          <label className="text-sm font-medium">Password</label>
          <Input type="password" placeholder="••••••••" className="mt-1" />
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="rounded" /> Remember me
          </label>
          <a href="#" className="text-sm text-primary hover:underline">Forgot password?</a>
        </div>
        <Button type="submit" className="w-full">Sign In</Button>
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>
        <Button variant="outline" className="w-full">GitHub</Button>
      </form>
    </div>
  );
}`,
  },
];

const FOOTER_COMPONENTS: LibraryComponent[] = [
  {
    id: "footer-multi-column",
    name: "Footer Multi-Column",
    category: "Footer",
    description: "4-column footer with about, links, social, newsletter",
    icon: "📎",
    dependencies: [],
    code: `export function Footer() {
  return (
    <footer className="border-t py-12 px-4">
      <div className="container mx-auto grid md:grid-cols-4 gap-8">
        <div>
          <h3 className="font-bold text-lg mb-4">Brand</h3>
          <p className="text-sm text-muted-foreground">Building the future of web development.</p>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Product</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <a href="#" className="block hover:text-foreground">Features</a>
            <a href="#" className="block hover:text-foreground">Pricing</a>
            <a href="#" className="block hover:text-foreground">Docs</a>
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Company</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <a href="#" className="block hover:text-foreground">About</a>
            <a href="#" className="block hover:text-foreground">Blog</a>
            <a href="#" className="block hover:text-foreground">Careers</a>
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Newsletter</h4>
          <p className="text-sm text-muted-foreground mb-2">Stay updated with our latest news.</p>
          <div className="flex gap-2">
            <input placeholder="Enter email" className="flex-1 rounded-md border px-3 py-2 text-sm" />
            <Button size="sm">Subscribe</Button>
          </div>
        </div>
      </div>
      <div className="container mx-auto mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Brand. All rights reserved.
      </div>
    </footer>
  );
}`,
  },
];

const CTA_COMPONENTS: LibraryComponent[] = [
  {
    id: "cta-section",
    name: "CTA Section",
    category: "CTA",
    description: "Bold heading with email input and CTA button",
    icon: "🎯",
    dependencies: ["Button"],
    code: `export function CTASection() {
  return (
    <section className="py-20 px-4 text-center">
      <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
      <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
        Join thousands of developers building amazing products.
      </p>
      <div className="mt-8 flex justify-center gap-2 max-w-md mx-auto">
        <input placeholder="Enter your email" className="flex-1 rounded-md border px-4 py-2" />
        <Button>Get Started</Button>
      </div>
    </section>
  );
}`,
  },
];

const BLOG_COMPONENTS: LibraryComponent[] = [
  {
    id: "blog-grid",
    name: "Blog Grid",
    category: "Blog",
    description: "Grid of blog post cards with image, title, excerpt",
    icon: "📝",
    dependencies: ["Card"],
    code: `export function BlogGrid() {
  const posts = [
    { title: "Getting Started with Next.js", excerpt: "Learn how to build modern web apps.", date: "Jan 15, 2024" },
    { title: "The Power of Tailwind CSS", excerpt: "Why utility-first CSS is the future.", date: "Jan 10, 2024" },
    { title: "TypeScript Best Practices", excerpt: "Write better, safer code.", date: "Jan 5, 2024" },
  ];

  return (
    <section className="py-20 px-4">
      <h2 className="text-3xl font-bold text-center mb-12">Blog</h2>
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {posts.map((post) => (
          <Card key={post.title} className="overflow-hidden">
            <div className="h-48 bg-muted" />
            <div className="p-4">
              <p className="text-xs text-muted-foreground">{post.date}</p>
              <h3 className="font-semibold mt-1">{post.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{post.excerpt}</p>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}`,
  },
];

const FAQ_COMPONENTS: LibraryComponent[] = [
  {
    id: "faq-accordion",
    name: "FAQ Accordion",
    category: "FAQ",
    description: "Accordion-style frequently asked questions",
    icon: "❓",
    dependencies: [],
    code: `export function FAQAccordion() {
  const faqs = [
    { q: "How does it work?", a: "Our platform uses AI to generate code based on your descriptions." },
    { q: "Is there a free plan?", a: "Yes! We offer a generous free tier to get started." },
    { q: "Can I export my code?", a: "Absolutely. You own all the code generated." },
    { q: "What frameworks are supported?", a: "Currently Next.js with TypeScript and Tailwind CSS." },
  ];

  return (
    <section className="py-20 px-4 max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-12">FAQ</h2>
      <div className="space-y-4">
        {faqs.map((faq) => (
          <details key={faq.q} className="group rounded-lg border p-4">
            <summary className="font-medium cursor-pointer">{faq.q}</summary>
            <p className="mt-2 text-sm text-muted-foreground">{faq.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}`,
  },
];

const AUTH_COMPONENTS: LibraryComponent[] = [
  {
    id: "auth-split",
    name: "Auth Split Screen",
    category: "Auth",
    description: "Split screen auth with image left, form right",
    icon: "🔐",
    dependencies: ["Button", "Input"],
    code: `export function AuthSplit() {
  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 bg-primary items-center justify-center">
        <div className="text-center text-primary-foreground">
          <h1 className="text-4xl font-bold">Welcome Back</h1>
          <p className="mt-2 text-lg opacity-90">Sign in to continue to your dashboard</p>
        </div>
      </div>
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold mb-6">Sign In</h2>
          <form className="space-y-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input type="email" placeholder="you@example.com" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Password</label>
              <Input type="password" className="mt-1" />
            </div>
            <Button className="w-full">Sign In</Button>
          </form>
        </div>
      </div>
    </div>
  );
}`,
  },
];

// ── Registry ──────────────────────────────────────────────────────

export const ALL_COMPONENTS: LibraryComponent[] = [
  ...LAYOUT_COMPONENTS,
  ...NAVIGATION_COMPONENTS,
  ...PRICING_COMPONENTS,
  ...DATA_DISPLAY_COMPONENTS,
  ...FORM_COMPONENTS,
  ...FOOTER_COMPONENTS,
  ...CTA_COMPONENTS,
  ...BLOG_COMPONENTS,
  ...FAQ_COMPONENTS,
  ...AUTH_COMPONENTS,
];

export const CATEGORIES = [
  "All",
  "Layout",
  "Navigation",
  "Pricing",
  "Data Display",
  "Forms",
  "Footer",
  "CTA",
  "Blog",
  "FAQ",
  "Auth",
];
