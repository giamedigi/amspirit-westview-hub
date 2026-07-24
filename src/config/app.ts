import type { AppConfiguration } from "@/lib/types";

export const appConfig: AppConfiguration = {
  name: "AM Spirit West View Chapter Hub",
  portal: { label: "Official AM Spirit Member Portal", url: "https://www.amspirit.com/login.php", newTab: true },
  // Remaining configuration: replace this when the public member-event form URL is supplied.
  submitEvent: { label: "Submit a Member Event", url: "#submission-link-coming-soon", placeholder: true },
  directions: {
    label: "Get Directions",
    url: "https://www.google.com/maps/search/?api=1&query=Dragon%27s+Roast+Cafe%2C+389+Perry+Highway%2C+Pittsburgh%2C+PA+15229",
    newTab: true,
  },
  meeting: {
    day: "Thursday", startTime: "9:15 AM", endTime: "10:30 AM",
    venue: "Dragon's Roast Cafe",
    addressLine1: "389 Perry Highway",
    addressLine2: "Pittsburgh, PA 15229",
  },
};
