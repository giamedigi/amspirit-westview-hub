export function PageHeading({title,children}:{title:string;children?:React.ReactNode}){return <header className="page-heading"><h1>{title}</h1>{children&&<p>{children}</p>}</header>}
