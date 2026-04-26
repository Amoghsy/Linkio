import { Logo } from "@/components/common/Logo";

export const AuthCard = ({
  title,
  subtitle,
  footer,
  children,
}: {
  title: string;
  subtitle?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="min-h-screen grid lg:grid-cols-2">
    <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-hero text-primary-foreground relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,hsl(38_95%_55%/0.25),transparent_60%)]" />
      <Logo className="relative text-primary-foreground [&_span]:text-primary-foreground" />
      <div className="relative">
        <h2 className="text-4xl font-bold leading-tight">
          Trusted help,<br /><span className="bg-gradient-amber bg-clip-text text-transparent">around the corner.</span>
        </h2>
        <p className="mt-4 text-white/80 max-w-md">
          Join thousands of customers and workers building stronger communities with AI-powered matching.
        </p>
      </div>
      <p className="relative text-xs text-white/60">© {new Date().getFullYear()} Linkio</p>
    </div>

    <div className="flex flex-col p-6 sm:p-10">
      <Logo to="/" className="lg:hidden mb-8" />
      <div className="flex-1 flex flex-col justify-center max-w-md w-full mx-auto">
        <h1 className="text-3xl font-bold">{title}</h1>
        {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
        <div className="mt-8">{children}</div>
        {footer && <div className="mt-6 text-sm text-center">{footer}</div>}
      </div>
    </div>
  </div>
);
