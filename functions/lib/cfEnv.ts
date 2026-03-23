/** Bindings available to Pages Functions (dashboard / wrangler). */
export interface CfEnv {
  FIREBASE_PROJECT_ID: string;
  FIREBASE_CLIENT_EMAIL: string;
  FIREBASE_PRIVATE_KEY: string;
  ZEPTOMAIL_TOKEN: string;
  ZOHO_ORDERS_USER?: string;
  ZOHO_ENQUIRIES_USER?: string;
  ZOHO_MARKETING_USER?: string;
  EMAIL_NEW_ORDER_NOTIFY_TO?: string;
  EMAIL_NEW_CONTACT_ENQUIRY_NOTIFY_TO?: string;
  EMAIL_NEW_REVIEW_NOTIFY_TO?: string;
  EMAIL_NOTIFY_BCC_ORDERS?: string;
  EMAIL_NOTIFY_BCC_ENQUIRIES?: string;
  /** Comma-separated extra CORS origins (optional) */
  CORS_ORIGINS?: string;
  EMAIL_OUTBOX_DEBUG?: string;
}
