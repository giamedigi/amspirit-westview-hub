import type { Announcement } from "@/lib/types";

export const announcements: Announcement[] = [
  {id:"summer-location",title:"Temporary meeting room update",message:"This Thursday, please enter through the side door and follow the chapter signs to the upstairs meeting room.",importance:"urgent",publishDate:"2026-07-20",expirationDate:"2026-08-31",showPopup:true,buttonText:"Meeting Information",buttonLink:"/meeting-information"},
  {id:"guest-week",title:"Guest welcome week is coming",message:"Consider inviting a business professional who would enjoy meeting the chapter.",importance:"important",publishDate:"2026-07-18",expirationDate:"2026-09-15",buttonText:"Invite a Guest",buttonLink:"/invite-a-guest"},
  {id:"lunch-pairings",title:"August Lunch Connections posted",message:"The next set of Lunch Connections pairings is ready to view.",importance:"normal",publishDate:"2026-07-15",expirationDate:"2026-09-01",buttonText:"View Pairings",buttonLink:"/lunch-connections"},
];

export const activeAnnouncements = (today = new Date()) =>
  announcements.filter((item) => new Date(`${item.publishDate}T00:00:00`) <= today && new Date(`${item.expirationDate}T23:59:59`) >= today)
    .sort((a,b) => b.publishDate.localeCompare(a.publishDate));
