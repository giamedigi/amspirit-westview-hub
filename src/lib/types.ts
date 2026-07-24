export type AnnouncementImportance = "normal" | "important" | "urgent";

export interface Member {
  id: string; fullName: string; businessName: string; profession: string;
  category: string; phone?: string; email?: string; website?: string;
  description: string; idealReferral: string; headshot?: string;
  businessCardImage?: string; permissions: { phone: boolean; email: boolean };
}
export interface MemberEvent {
  id: string; title: string; date: string; startTime: string; endTime: string;
  location?: string; venue?: string; address?: string; description: string;
  eventType?: string; eventFormat?: string; recurring?: string;
  recurrenceDetails?: string; virtualLink?: string; openToPublic?: string;
  registrationRequired?: string; registrationLink?: string; cost?: string;
  registrationDeadline?: string; targetAudience?: string; flyer?: string;
  socialGraphic?: string; type: "member" | "community";
}
export interface ChapterMeeting {
  day: "Thursday"; startTime: string; endTime: string; venue: string;
  addressLine1: string; addressLine2: string;
}
export interface Announcement {
  id: string; title: string; message: string; importance: AnnouncementImportance;
  publishDate: string; expirationDate: string; image?: string; buttonText?: string;
  buttonLink?: string; showPopup?: boolean;
}
export interface LunchGroup { id: string; members: string[]; }
export interface LunchMonth { month: number; year: number; groups: LunchGroup[]; }
export interface ExternalLink { label: string; url: string; newTab?: boolean; placeholder?: boolean; }
export interface AppConfiguration {
  name: string; portal: ExternalLink; facebook: ExternalLink;
  submitEvent: ExternalLink; directions: ExternalLink;
  meeting: ChapterMeeting;
}
