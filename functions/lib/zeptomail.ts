import type { CfEnv } from './cfEnv';

export type ZeptoAttachment = { name: string; contentBase64: string; mimeType: string };

export type ZeptoMailInput = {
  from: { address: string; name: string };
  to: string[];
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  subject: string;
  html: string;
  attachments?: ZeptoAttachment[];
};

function toRecipients(addresses: string[] | undefined, defaultName = '') {
  if (!addresses?.length) return [];
  return addresses.map((address) => ({
    email_address: {
      address,
      name: defaultName || address.split('@')[0] || '',
    },
  }));
}

export async function sendZeptoMail(env: CfEnv, input: ZeptoMailInput): Promise<void> {
  const token = env.ZEPTOMAIL_TOKEN?.trim();
  if (!token) throw new Error('ZEPTOMAIL_TOKEN is not configured');
  const apiBase = (env.ZEPTOMAIL_API_BASE || 'https://api.zeptomail.eu').replace(/\/+$/, '');
  const url = `${apiBase}/v1.1/email`;

  const body: Record<string, unknown> = {
    from: { address: input.from.address, name: input.from.name },
    to: toRecipients(input.to),
    subject: input.subject,
    htmlbody: input.html,
  };

  const cc = toRecipients(input.cc);
  if (cc.length) body.cc = cc;

  const bcc = toRecipients(input.bcc);
  if (bcc.length) body.bcc = bcc;

  if (input.replyTo?.trim()) {
    body.reply_to = [{ address: input.replyTo.trim(), name: '' }];
  }

  if (input.attachments?.length) {
    body.attachments = input.attachments.map((a) => ({
      name: a.name,
      content: a.contentBase64,
      mime_type: a.mimeType,
    }));
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Zoho-enczapikey ${token}`,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`ZeptoMail ${res.status}: ${text.slice(0, 600)}`);
  }
}
