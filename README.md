<div align="center">

[![npm latest package][npm-latest-image]][npm-url]
[![Build Status][ci-image]][ci-url]
[![License][license-image]][license-url]
[![npm downloads][npm-downloads-image]][npm-url]
[![Follow on Twitter][twitter-image]][twitter-url]

</div>

## liquidcn - Reusable UI Components

A collection of reusable, accessible React UI components built with TypeScript, Tailwind CSS, and modern development tools.

## Summary

**liquidcn** is a comprehensive component library featuring:

- **UI Components**: Button, Card, Alert, Badge, Input, Textarea, Footer, PrettyAmount
- **Client Components**: Dialog, Select, Switch, Tabs, Sonner (Toast), PrettyDate, ResizableNavbar, Slider
- **Form Components**: FormBuilder (schema-driven forms with AI mode), ChatView (AI chat interface)
- **Hooks**: Custom React hooks including `useCookieWithFallback`
- **Utilities**: `cn()` utility for className merging using clsx and tailwind-merge

Bun + Npm + Typescript + Standard Version + Flat Config Linting + Husky + Commit / Release Pipeline

Check out the [Changelog](./CHANGELOG.md) to see what changed in the last releases.

## Install

```bash
bun add liquidcn
```

Install Bun ( bun is the default package manager for this project ( its optional ) ):

```bash
# Supported on macOS, Linux, and WSL
curl -fsSL https://bun.sh/install | bash
# Upgrade Bun every once in a while
bun upgrage
```

## Usage

### Import Styles

Add the liquidcn styles to your project root or layout file:

```typescript
import 'liquidcn/styles.css'
```

### Navbar Component

The `ResizableNavbar` component provides a responsive navigation bar with desktop and mobile support:

```typescript
'use client'
import {
  Navbar as ResizableNavbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from 'liquidcn/client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { name: 'Projects', link: '/' },
  { name: 'Deploy', link: '/deploy' },
  { name: 'Docs', link: '/docs' },
]

export function Navbar({ className }: { className?: string }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <ResizableNavbar className={className} menuOpen={isMobileMenuOpen}>
      {/* Desktop Navigation */}
      <NavBody>
        <NavbarLogo imageSrc="/logo.png" />
        <NavItems items={navItems} currentPath={pathname} />
        <div className="flex items-center gap-4">
          <NavbarButton>Your Content Here</NavbarButton>
        </div>
      </NavBody>

      {/* Mobile Navigation */}
      <MobileNav>
        <MobileNavHeader>
          <NavbarLogo imageSrc="/logo.png" />
          <MobileNavToggle
            isOpen={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          />
        </MobileNavHeader>

        <MobileNavMenu isOpen={isMobileMenuOpen}>
          {navItems.map((item, idx) => (
            <Link key={idx} href={item.link}>
              {item.name}
            </Link>
          ))}
        </MobileNavMenu>
      </MobileNav>
    </ResizableNavbar>
  )
}
```

### Footer Component

The `Footer` component displays links with icons and social media integration:

```typescript
'use client'
import Link from 'next/link'
import { FileText } from 'lucide-react'
import { SiFarcaster } from 'react-icons/si'
import { FaSquareXTwitter } from 'react-icons/fa6'
import { Footer, type FooterLink } from 'liquidcn'

const footerLinks: FooterLink[] = [
  {
    name: 'Twitter / X',
    href: 'https://x.com/yourhandle',
    icon: FaSquareXTwitter,
    showLabel: false,
  },
  {
    name: 'Farcaster',
    href: 'https://farcaster.xyz/yourhandle',
    icon: SiFarcaster,
    showLabel: false,
  },
  {
    name: 'Documentation',
    href: 'https://docs.example.com',
    icon: FileText,
    showLabel: true,
  },
]

export function MyFooter() {
  return (
    <Footer
      links={footerLinks}
      builtByBrand="Your Brand"
      linkComponent={Link}
    />
  )
}
```

### FormBuilder Component

The `FormBuilder` component renders schema-driven forms with optional AI-powered form filling. Works with `useSchemaForm` from `tanstack-effect`.

#### Basic Usage

```tsx
import { useSchemaForm } from 'tanstack-effect/client'
import { FormBuilder, FormValidationAlert, isFormValid } from 'liquidcn/client'
import { Button } from 'liquidcn'
import { Schema } from 'effect'

const ProjectSchema = Schema.Struct({
  projectName: Schema.String.pipe(Schema.annotations({ description: 'Name of the project' })),
  projectType: Schema.Literal('web', 'mobile', 'desktop').pipe(
    Schema.annotations({ description: 'Type of project' })
  ),
  teamSize: Schema.Number.pipe(Schema.annotations({ description: 'Number of team members' })),
})

function ProjectForm() {
  const form = useSchemaForm({
    schema: ProjectSchema,
  })

  return (
    <div>
      <FormBuilder form={form} variant="default" />
      <Button onClick={() => console.log(form.data)}>Submit</Button>
      <FormValidationAlert form={form} />
    </div>
  )
}
```

#### With AI Mode

Enable AI-powered form filling by adding the `ai` option to `useSchemaForm` and `enableAIMode` to `FormBuilder`:

```tsx
import { useSchemaForm } from 'tanstack-effect/client'
import { FormBuilder, FormValidationAlert } from 'liquidcn/client'
import { Button } from 'liquidcn'
import { Schema } from 'effect'

const ProjectSchema = Schema.Struct({
  projectName: Schema.String.pipe(Schema.annotations({ description: 'Name of the project' })),
  projectType: Schema.Literal('web', 'mobile', 'desktop').pipe(
    Schema.annotations({ description: 'Type of project' })
  ),
  teamSize: Schema.Number.pipe(Schema.annotations({ description: 'Number of team members' })),
})

function ProjectForm() {
  const form = useSchemaForm({
    schema: ProjectSchema,
    // Enable AI form filling
    ai: {
      endpoint: '/api/ai-form-fill',
    },
  })

  return (
    <div>
      <FormBuilder
        form={form}
        variant="wizard"
        enableAIMode
        aiPlaceholder="Describe your project..."
        aiChatMinHeight="300px"
      />
      <Button onClick={() => console.log(form.data)}>Submit</Button>
      <FormValidationAlert form={form} />
    </div>
  )
}
```

With AI mode enabled, the FormBuilder shows:

- **AI/Edit toggle buttons** - Switch between chat and manual editing
- **Chat interface** - Full conversation with AI including message history
- **Clarification prompts** - AI asks for missing required fields
- **Summary** - Shows what fields were filled (e.g. "Filled 3 fields: projectName, projectType, teamSize")

#### FormBuilder Props

| Prop              | Type                                 | Default     | Description                     |
| ----------------- | ------------------------------------ | ----------- | ------------------------------- |
| `form`            | `UseSchemaFormReturn`                | required    | Form state from `useSchemaForm` |
| `variant`         | `'default' \| 'compact' \| 'wizard'` | `'default'` | Display variant                 |
| `enableAIMode`    | `boolean`                            | `false`     | Show AI/Edit mode toggle        |
| `initialMode`     | `'ai' \| 'edit'`                     | `'ai'`      | Initial mode when AI is enabled |
| `aiPlaceholder`   | `string`                             | -           | Placeholder for AI chat input   |
| `aiChatMinHeight` | `string`                             | `'300px'`   | Minimum height for chat view    |
| `pinnedFields`    | `string[]`                           | `[]`        | Fields to show at top level     |
| `hiddenFields`    | `string[]`                           | `[]`        | Fields to hide from form        |

### ChatView Component

The `ChatView` component provides a standalone chat UI for AI interactions:

```tsx
import { ChatView } from 'liquidcn/client'

function AIChat() {
  const [messages, setMessages] = useState([])

  return (
    <ChatView
      messages={messages}
      clarifications={[]}
      status="idle"
      summary={null}
      onSend={(msg) => console.log('Send:', msg)}
      onAnswer={(field, value) => console.log('Answer:', field, value)}
      placeholder="Ask me anything..."
    />
  )
}
```

## Developing

Install Dependencies:

```bash
bun i
```

Watching TS Problems:

```bash
bun watch
```

Format / Lint / Type Check:

```bash
bun format
bun lint
bun type-check
```

## How to make a release

**For the Maintainer**: Add `NPM_TOKEN` to the GitHub Secrets.

1. PR with changes
2. Merge PR into main
3. Checkout main
4. `git pull`
5. `bun release: '' | alpha | beta` optionally add `-- --release-as minor | major | 0.0.1`
6. Make sure everything looks good (e.g. in CHANGELOG.md)
7. Lastly run `bun release:pub`
8. Done

## License

This package is licensed - see the [LICENSE](./LICENSE.md) file for details.

[ci-image]: https://badgen.net/github/checks/mguleryuz/liquidcn/main?label=ci
[ci-url]: https://github.com/mguleryuz/liquidcn/actions/workflows/ci.yaml
[npm-url]: https://npmjs.org/package/liquidcn
[twitter-url]: https://twitter.com/0xxmemo
[twitter-image]: https://img.shields.io/twitter/follow/0xxmemo.svg?label=follow+liquidcn
[license-image]: https://img.shields.io/badge/License-Apache%20v2-blue
[license-url]: ./LICENSE.md
[npm-latest-image]: https://img.shields.io/npm/v/liquidcn/latest.svg
[npm-downloads-image]: https://img.shields.io/npm/dm/liquidcn.svg
