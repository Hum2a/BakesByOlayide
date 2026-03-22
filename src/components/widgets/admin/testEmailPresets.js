/**
 * Presets for Admin → Test Email. Each maps to a real API route and Zoho SMTP account on the server.
 * (There is no separate “Developers” transporter in code — only Orders, Enquiries, Marketing.)
 */

export const TEST_EMAIL_PRESETS = [
  {
    id: 'simple_orders',
    label: 'Simple ping',
    smtp: 'Orders',
    route: 'POST /api/test-email',
    description: 'Short message from the orders mailbox (same account as order flows).',
  },
  {
    id: 'order_confirmation',
    label: 'Order confirmation',
    smtp: 'Orders',
    route: 'POST /api/send-order-confirmation',
    description: 'Same endpoint as sending a real order confirmation; optional CC for staff.',
  },
  {
    id: 'enquiry_reply',
    label: 'Enquiry reply',
    smtp: 'Enquiries',
    route: 'POST /api/send-enquiry-reply',
    description: 'Same as replying from Enquiries; optional CC (e.g. another inbox).',
  },
  {
    id: 'order_enquiry',
    label: 'Basket / order enquiry',
    smtp: 'Orders',
    route: 'POST /api/send-order-enquiry',
    description: 'Shop copy to the orders inbox (like checkout); optional customer acknowledgement.',
  },
  {
    id: 'marketing_style',
    label: 'Marketing layout (single recipient)',
    smtp: 'Marketing',
    route: 'POST /api/test-marketing-email',
    description: 'Uses the marketing SMTP without querying newsletter subscribers.',
  },
  {
    id: 'marketing_broadcast',
    label: 'Newsletter send (real subscribers)',
    smtp: 'Marketing',
    route: 'POST /api/send-marketing-email',
    description: 'Production path: BCCs all opted-in subscribers for selected lists. Use with care.',
    dangerous: true,
  },
];

export function getPresetBodies(presetId) {
  switch (presetId) {
    case 'order_confirmation':
      return {
        subject: 'TEST — Order confirmation',
        html: `<p>Hi,</p>
<p>This is a <strong>test</strong> order confirmation from the admin <em>Test Email</em> tool.</p>
<p>If you see this, <code>/api/send-order-confirmation</code> and the Orders mailbox are working.</p>`,
      };
    case 'enquiry_reply':
      return {
        subject: 'TEST — Re: Your enquiry',
        html: `<p>Dear customer,</p>
<p>This is a <strong>test</strong> enquiry-style reply from the admin dashboard.</p>
<p>If you see this, <code>/api/send-enquiry-reply</code> and the Enquiries mailbox are working.</p>
<p>Best regards,<br/>Bakes by Olayide</p>`,
      };
    case 'order_enquiry':
      return {
        shopSubject: 'TEST — New order enquiry (shop)',
        shopHtml: `<p><strong>Test shop notification</strong> — this is what staff receive for a basket/order enquiry.</p>
<p><code>/api/send-order-enquiry</code> → orders inbox.</p>`,
        customerSubject: 'TEST — We received your order request',
        customerHtml: `<p>Thank you for getting in touch.</p>
<p>This is a <strong>test</strong> customer acknowledgement from the same flow as checkout.</p>`,
      };
    case 'marketing_style':
      return {
        subject: 'Test campaign',
        html: `<p>This is a <strong>test</strong> marketing-layout email.</p>
<p>It uses the Marketing SMTP account without sending to your newsletter list.</p>`,
      };
    case 'marketing_broadcast':
      return {
        subject: 'TEST — Newsletter (subscribers)',
        html: `<p>This is a <strong>test broadcast</strong> via the real newsletter endpoint.</p>
<p>Everyone opted in (and matching the lists you pick) will receive it.</p>`,
      };
    default:
      return null;
  }
}
