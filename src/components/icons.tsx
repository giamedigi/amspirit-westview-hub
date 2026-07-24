export function Icon({name}:{name:string}) {
  const paths:Record<string,string>={
    home:"M3 11 12 3l9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
    calendar:"M5 3v3m14-3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1z",
    members:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m7-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8m13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
    lunch:"M4 3v8a4 4 0 0 0 4 4V3m-4 4h4m8-4v18m0-18c3 2 4 5 0 9",
    more:"M5 12h.01M12 12h.01M19 12h.01",
    alert:"M12 9v4m0 4h.01M10.3 4.3 2 19h20L13.7 4.3a2 2 0 0 0-3.4 0z",
    invite:"M15 19c0-3-2-5-6-5s-6 2-6 5m6-9a3 3 0 1 0 0-6 3 3 0 0 0 0 6m10-3v6m-3-3h6",
    submit:"M12 5v14m-7-7h14",
    facebook:"M14 21v-8h3l.5-4H14V7c0-1.2.4-2 2.2-2H18V2.2C17.3 2.1 16.2 2 15 2c-3 0-5 1.8-5 5v2H7v4h3v8",
  };
  return <svg className="icon" viewBox="0 0 24 24" aria-hidden="true"><path d={paths[name]||paths.more}/></svg>;
}
