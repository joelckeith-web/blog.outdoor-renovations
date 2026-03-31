import type { ServiceAreaLink } from "@/lib/types";

interface ServiceAreaFooterProps {
  links: ServiceAreaLink[];
}

export default function ServiceAreaFooter({ links }: ServiceAreaFooterProps) {
  if (!links || links.length === 0) return null;

  return (
    <div className="mt-10 pt-6 border-t border-gray-200">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
        Landscaping Services Near You
      </h3>
      <div className="flex flex-wrap gap-2">
        {links.map((link) => (
          <a
            key={link.url}
            href={link.url}
            className="text-xs bg-gray-100 text-brand-dark px-3 py-1.5 rounded-full hover:bg-brand-accent-light hover:text-brand-accent transition-colors"
          >
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}
