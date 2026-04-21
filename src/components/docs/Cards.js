import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function Cards({ children }) {
  return (
    <div className="not-prose my-6 grid gap-4 sm:grid-cols-2">
      {children}
    </div>
  );
}

export function Card({ icon, title, description, href, children }) {
  const content = (
    <>
      <div className="flex items-start gap-3">
        {icon && (
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            {icon}
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-foreground mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground">
            {description || children}
          </p>
        </div>
        {href && (
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        )}
      </div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group block rounded-lg border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      {content}
    </div>
  );
}
