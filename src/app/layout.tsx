import type {Metadata} from "next"; import "./globals.css"; import {SiteShell} from "@/components/site-shell";
export const metadata:Metadata={title:{default:"AM Spirit West View Chapter Hub",template:"%s | AM Spirit West View"},description:"Practical chapter information, events, members, announcements, and Lunch Connections."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><SiteShell>{children}</SiteShell></body></html>}
