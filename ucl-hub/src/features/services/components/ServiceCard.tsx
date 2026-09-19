import { Clock, ExternalLink, Mail, MapPin, Phone } from "lucide-react";
import { MetaLine } from "@/components/common/MetaLine";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { CampusService } from "@/types";
import { humanize } from "@/utils/text";

export function ServiceCard({ service }: { service: CampusService }) {
  return (
    <Card className="flex flex-col p-4">
      <div className="mb-2">
        <Badge tone="brand">{humanize(service.category)}</Badge>
      </div>
      <h3 className="text-base font-semibold text-slate-900">{service.name}</h3>
      <p className="mt-1 text-sm text-slate-600">{service.description}</p>
      <div className="mt-3 space-y-1.5">
        <MetaLine icon={MapPin}>{service.location}</MetaLine>
        <MetaLine icon={Clock}>
          <span className="block">
            {service.openingHours.map((line) => (
              <span key={`${line.days}-${line.hours}`} className="block">
                <span className="font-medium text-slate-700">{line.days}:</span> {line.hours}
              </span>
            ))}
          </span>
        </MetaLine>
        {service.email && (
          <MetaLine icon={Mail}>
            <a className="text-brand-700 hover:underline" href={`mailto:${service.email}`}>
              {service.email}
            </a>
          </MetaLine>
        )}
        {service.phone && (
          <MetaLine icon={Phone}>
            <a className="text-brand-700 hover:underline" href={`tel:${service.phone.replace(/\s/g, "")}`}>
              {service.phone}
            </a>
          </MetaLine>
        )}
      </div>
      {service.links.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {service.links.map((link) => (
            <li key={link.url}>
              <a href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50">
                <ExternalLink className="size-3.5" aria-hidden="true" />
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
