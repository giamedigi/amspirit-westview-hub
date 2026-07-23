"use client";
import { useEffect,useRef } from "react";
import Link from "next/link";
import type { Announcement } from "@/lib/types";

export function UrgentModal({announcement}:{announcement?:Announcement}){
  const dialog=useRef<HTMLDialogElement>(null); const close=useRef<HTMLButtonElement>(null);
  useEffect(()=>{ if(!announcement)return; const key=`dismissed-announcement-${announcement.id}`; if(!localStorage.getItem(key)){dialog.current?.showModal();setTimeout(()=>close.current?.focus(),0)}},[announcement]);
  const dismiss=()=>{if(announcement)localStorage.setItem(`dismissed-announcement-${announcement.id}`,"true");dialog.current?.close()};
  if(!announcement)return null;
  return <dialog ref={dialog} className="urgent-dialog" aria-labelledby="urgent-title" onCancel={dismiss}>
    <div><span className="eyebrow">Important chapter update</span><h2 id="urgent-title">{announcement.title}</h2><p>{announcement.message}</p><div className="button-row"><Link className="button primary" href={`/announcements/${announcement.id}`} onClick={()=>dialog.current?.close()}>View Full Announcement</Link><button ref={close} className="button secondary" onClick={dismiss}>Dismiss</button></div></div>
  </dialog>;
}
