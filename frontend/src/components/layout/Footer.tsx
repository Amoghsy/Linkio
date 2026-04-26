import { Link } from "react-router-dom";
import { Logo } from "@/components/common/Logo";

export const Footer = () => (
  <footer className="border-t border-border bg-secondary/30 mt-20">
    <div className="container py-12 grid gap-10 md:grid-cols-4">
      <div className="md:col-span-2">
        <Logo />
        <p className="mt-3 text-sm text-muted-foreground max-w-xs">
          AI-powered hyperlocal job marketplace for community growth. Find help nearby in minutes.
        </p>
      </div>
      <div>
        <h4 className="font-semibold mb-3 text-sm">Product</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li><Link to="/login" className="hover:text-primary">Find a Worker</Link></li>
          <li><Link to="/signup" className="hover:text-primary">Become a Worker</Link></li>
          <li><Link to="/admin/login" className="hover:text-primary">Admin Portal</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="font-semibold mb-3 text-sm">Company</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>About</li>
          <li>SDG 8 Impact</li>
          <li>Careers</li>
        </ul>
      </div>
    </div>
    <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
      © {new Date().getFullYear()} Linkio. Building communities, one job at a time.
    </div>
  </footer>
);
