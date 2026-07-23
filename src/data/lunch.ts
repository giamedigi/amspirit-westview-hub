import type { LunchMonth } from "@/lib/types";
const names=["Angela Morris","David Chen","Rachel Foster","Marcus Reed","Priya Shah","Thomas Baker","Elena Ruiz","Noah Williams","Carolyn James","Owen Price","Maya Brooks","Liam Scott","Grace Lee","Henry Adams","Sofia Turner","Jack Hall"];
const groups=(offset:number)=>Array.from({length:8},(_,i)=>({id:`g${offset}-${i+1}`,members:[names[(i*2+offset)%16],names[(i*2+1+offset)%16],...(i%3===0?[names[(i*2+8+offset)%16]]:[])]}));
export const lunchMonths: LunchMonth[] = [
  {month:7,year:2026,groups:groups(0)},
  {month:8,year:2026,groups:groups(3)},
  {month:9,year:2026,groups:groups(6)},
];
