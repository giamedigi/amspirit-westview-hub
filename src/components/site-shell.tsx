"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { appConfig } from "@/config/app";
import { Icon } from "./icons";

const nav=[["Home","/","home"],["Calendar","/calendar","calendar"],["Members","/members","members"],["Lunch","/lunch-connections","lunch"]];
const more=[["Announcements","/announcements"],["Invite a Guest","/invite-a-guest"],["Submit an Event","/submit-event"],["Meeting Information","/meeting-information"]];

export function SiteShell({children}:{children:React.ReactNode}){
  const path=usePathname();
  const active=(href:string)=>href==="/"?path==="/":path.startsWith(href);
  return <>
    <a className="skip-link" href="#main">Skip to main content</a>
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="brand" aria-label="AM Spirit West View Chapter Hub home">
          <span className="logo-placeholder" aria-hidden="true">AM</span>
          <span><strong>AM Spirit</strong><small>West View Chapter Hub</small></span>
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          {nav.map(([label,href])=><Link key={href} className={active(href)?"active":""} href={href}>{label}</Link>)}
          {more.map(([label,href])=><Link key={href} className={active(href)?"active":""} href={href}>{label}</Link>)}
        </nav>
      </div>
    </header>
    <main id="main" className="page-container">{children}</main>
    <footer><p>Independently created and managed for the AM Spirit West View Chapter. This is not an official AM Spirit Business Connections website or application.</p><a href={appConfig.portal.url} target="_blank" rel="noreferrer">{appConfig.portal.label}<span className="sr-only"> (opens in a new tab)</span></a></footer>
    <nav className="bottom-nav" aria-label="Mobile navigation">
      {nav.map(([label,href,icon])=><Link key={href} className={active(href)?"active":""} aria-current={active(href)?"page":undefined} href={href}><Icon name={icon}/><span>{label}</span></Link>)}
      <details><summary className={more.some(([,h])=>active(h))?"active":""}><Icon name="more"/><span>More</span></summary><div className="more-menu">{more.map(([label,href])=><Link key={href} href={href}>{label}</Link>)}<a href={appConfig.portal.url} target="_blank" rel="noreferrer">{appConfig.portal.label}</a></div></details>
    </nav>
  </>;
}
