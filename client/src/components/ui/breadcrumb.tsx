import { ChevronRight, Home } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav className={cn("flex items-center space-x-1 text-sm text-gray-600", className)}>
      <Link href="/">
        <button className="flex items-center px-2 py-1 rounded-md hover:bg-gray-100 transition-colors">
          <Home className="w-4 h-4" />
        </button>
      </Link>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          <ChevronRight className="w-4 h-4 text-gray-400 mx-1" />
          {item.href ? (
            <Link href={item.href}>
              <button className="flex items-center px-2 py-1 rounded-md hover:bg-gray-100 transition-colors">
                {item.icon && <item.icon className="w-4 h-4 mr-1" />}
                {item.label}
              </button>
            </Link>
          ) : (
            <span className="flex items-center px-2 py-1 font-medium text-gray-900">
              {item.icon && <item.icon className="w-4 h-4 mr-1" />}
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}