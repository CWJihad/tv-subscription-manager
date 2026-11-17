/** GET /meta */
export interface Meta {
  today: string; // YYYY-MM-DD
  timezone: string; // e.g. Asia/Dhaka
  currency: string; // e.g. BDT
  expiringWindowDays: number;
}