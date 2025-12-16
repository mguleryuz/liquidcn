import { Heart } from 'lucide-react'
import type { ComponentType, ReactNode } from 'react'

export interface FooterLink {
  name: string
  href: string
  icon: ComponentType<{ className?: string }>
  showLabel?: boolean
}

export interface FooterProps {
  links: FooterLink[]
  builtByText?: ReactNode
  builtByBrand?: string
  showLogo?: boolean
  linkComponent?: ComponentType<{
    href: string
    target?: string
    rel?: string
    className?: string
    'aria-label'?: string
    children: ReactNode
  }>
}

export function Footer({
  links,
  builtByText = 'Built by',
  builtByBrand = 'Levr',
  showLogo = true,
  linkComponent: LinkComponent = ({ href, ...props }: any) => <a href={href} {...props} />,
}: FooterProps) {
  return (
    <footer className="relative mt-auto">
      {/* Liquid glass top border glow only */}
      <div className="absolute top-0 left-0 right-0 h-px liquid-glass-border" />

      <div className="relative z-10 py-6 px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Social Links */}
          <nav className="flex items-center gap-6" aria-label="Footer navigation">
            {links.map((link) => (
              <LinkComponent
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-200"
                aria-label={link.name}
              >
                <link.icon className="h-5 w-5" />
                {link.showLabel && <span className="text-sm font-medium">{link.name}</span>}
              </LinkComponent>
            ))}
          </nav>

          {/* Built by */}
          {showLogo && (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              {builtByText} <b className="text-primary">{builtByBrand}</b> team with{' '}
              <Heart className="h-4 w-4 text-red-500 fill-red-500" />
            </p>
          )}
        </div>
      </div>
    </footer>
  )
}
