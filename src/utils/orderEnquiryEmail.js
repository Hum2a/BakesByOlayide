/** Escape text for HTML email bodies (user-supplied fields). */
function esc(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatPickup(pickupDate, pickupTime) {
  if (!pickupDate && !pickupTime) return '—';
  let dateStr = '';
  if (pickupDate) {
    try {
      dateStr = new Date(pickupDate).toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      dateStr = esc(pickupDate);
    }
  }
  const timeStr = pickupTime ? esc(pickupTime) : '';
  return [dateStr, timeStr].filter(Boolean).join(' · ') || '—';
}

function itemOptionsHtml(item) {
  const lines = [];
  if (item.selectedSize) {
    lines.push(`<div><b>Size:</b> ${esc(item.selectedSize.size)}</div>`);
  }
  if (item.batchSize) {
    lines.push(`<div><b>Batch size:</b> ${esc(item.batchSize)}</div>`);
  }
  if (item.selectedShape?.name) {
    lines.push(`<div><b>Shape:</b> ${esc(item.selectedShape.name)}</div>`);
  }
  if (item.decorationStyle) {
    lines.push(`<div><b>Decoration:</b> ${esc(item.decorationStyle)}</div>`);
  }
  if (item.selectedFinish?.name) {
    lines.push(`<div><b>Finish:</b> ${esc(item.selectedFinish.name)}</div>`);
  }
  if (item.occasion) {
    lines.push(`<div><b>Occasion:</b> ${esc(item.occasion)}</div>`);
  }
  if (item.topper) {
    lines.push(`<div><b>Topper:</b> ${esc(item.topper)}</div>`);
  }
  if (item.addon) {
    const add = Array.isArray(item.addon) ? item.addon.join(', ') : item.addon;
    lines.push(`<div><b>Add-ons:</b> ${esc(add)}</div>`);
  }
  if (item.notes) {
    lines.push(`<div><b>Notes:</b> ${esc(item.notes)}</div>`);
  }
  if (item.designInspiration) {
    lines.push(`<div><b>Design inspiration:</b> ${esc(item.designInspiration)}</div>`);
  }
  return lines.join('');
}

function itemsTableRows(items) {
  return (items || []).map((item) => `
    <tr>
      <td style="padding:12px 8px;border-bottom:1px solid #eee;vertical-align:top;">
        ${item.image ? `<img src="${esc(item.image)}" alt="" style="width:60px;height:60px;object-fit:cover;border-radius:6px;display:block;margin-bottom:6px;" />` : ''}
        <div style="font-weight:600;">${esc(item.name)}</div>
      </td>
      <td style="padding:12px 8px;border-bottom:1px solid #eee;text-align:center;">${esc(item.quantity)}</td>
      <td style="padding:12px 8px;border-bottom:1px solid #eee;text-align:center;">£${Number(item.price || 0).toFixed(2)}</td>
      <td style="padding:12px 8px;border-bottom:1px solid #eee;font-size:0.95em;color:#444;vertical-align:top;">
        ${itemOptionsHtml(item)}
      </td>
    </tr>
  `).join('');
}

/**
 * Email to the bakery orders inbox (full detail for approval / Zoho workflow).
 */
export function buildShopEnquiryEmail(payload) {
  const {
    orderId,
    items,
    subtotal,
    total,
    appliedDiscount,
    guestInfo,
    pickupDate,
    pickupTime,
    enquiryNotes,
  } = payload;

  const name = guestInfo?.name || '—';
  const email = guestInfo?.email || '—';
  const phone = guestInfo?.phone || '—';
  const discountBlock = appliedDiscount
    ? `<div style="margin:12px 0;padding:12px;background:#fff8e6;border-radius:8px;">
        <b>Discount:</b> ${esc(appliedDiscount.description || appliedDiscount.code)} (−£${Number(appliedDiscount.amount || 0).toFixed(2)})
       </div>`
    : '';
  const notesBlock = enquiryNotes
    ? `<div style="margin:12px 0;padding:12px;background:#f0f7ff;border-radius:8px;">
        <b>Customer message:</b><br/>${esc(enquiryNotes).replace(/\n/g, '<br/>')}
       </div>`
    : '';

  return `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:700px;margin:0 auto;background:#fff;padding:24px;">
      <h1 style="color:#222;font-size:1.4rem;margin:0 0 8px;">New order enquiry (pay in person)</h1>
      <p style="color:#666;margin:0 0 20px;">Approve and contact the customer via email or phone. Payment will be arranged in person.</p>
      <div style="margin-bottom:16px;font-size:1.05rem;line-height:1.6;">
        <div><b>Order ID:</b> <span style="color:#c0392b;">${esc(orderId)}</span></div>
        <div><b>Pickup:</b> ${formatPickup(pickupDate, pickupTime)}</div>
      </div>
      <div style="margin-bottom:18px;padding:14px;background:#fafbfc;border-radius:8px;">
        <h2 style="font-size:1.05rem;margin:0 0 8px;">Customer</h2>
        <div><b>Name:</b> ${esc(name)}</div>
        <div><b>Email:</b> <a href="mailto:${esc(email)}">${esc(email)}</a></div>
        <div><b>Phone:</b> <a href="tel:${esc(phone)}">${esc(phone)}</a></div>
      </div>
      ${notesBlock}
      <h2 style="font-size:1.05rem;margin:16px 0 8px;">Items</h2>
      <table style="width:100%;border-collapse:collapse;background:#fafbfc;border-radius:8px;overflow:hidden;">
        <thead>
          <tr style="background:#f3c307;color:#222;">
            <th style="padding:10px 8px;text-align:left;">Item</th>
            <th style="padding:10px 8px;text-align:center;">Qty</th>
            <th style="padding:10px 8px;text-align:center;">Price</th>
            <th style="padding:10px 8px;text-align:left;">Options</th>
          </tr>
        </thead>
        <tbody>${itemsTableRows(items)}</tbody>
      </table>
      ${discountBlock}
      <div style="text-align:right;margin-top:16px;font-size:1.1rem;">
        ${subtotal != null && subtotal !== total ? `<div style="color:#666;">Subtotal: £${Number(subtotal).toFixed(2)}</div>` : ''}
        <div style="font-weight:700;font-size:1.25rem;color:#2c3e50;">Total: £${Number(total || 0).toFixed(2)}</div>
      </div>
      <p style="margin-top:24px;color:#888;font-size:0.9rem;">This enquiry was submitted from the website basket. Manage the order in Admin → Orders.</p>
    </div>
  `;
}

/**
 * Short acknowledgement to the customer.
 */
export function buildCustomerEnquiryAckEmail(payload) {
  const {
    orderId,
    items,
    total,
    guestInfo,
    pickupDate,
    pickupTime,
  } = payload;

  const pickupLine = formatPickup(pickupDate, pickupTime);
  const itemSummary = (items || []).slice(0, 6).map((i) =>
    `<li>${esc(i.name)} × ${esc(i.quantity)}</li>`
  ).join('');
  const more = (items || []).length > 6 ? `<p style="color:#666;font-size:0.95rem;">…and ${(items || []).length - 6} more line(s).</p>` : '';

  return `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;padding:28px 22px;">
      <div style="text-align:center;margin-bottom:20px;">
        <img src="https://bakesbyolayide.co.uk/logos/LogoYellowTransparent.png" alt="Bakes by Olayide" style="height:52px;" />
      </div>
      <h1 style="color:#222;font-size:1.35rem;margin:0 0 12px;text-align:center;">We’ve received your order request</h1>
      <p style="color:#555;line-height:1.6;margin:0 0 16px;">Hi ${esc(guestInfo?.name || 'there')},</p>
      <p style="color:#555;line-height:1.6;margin:0 0 16px;">
        Thank you for your order enquiry. Our team will review it and contact you by email or phone to confirm details and arrange <strong>payment in person</strong> (card or cash as agreed).
      </p>
      <div style="background:#fffbe6;border-radius:10px;padding:14px 16px;margin:18px 0;">
        <div style="font-weight:600;margin-bottom:6px;">Reference: ${esc(orderId)}</div>
        <div style="color:#444;"><b>Requested pickup:</b> ${pickupLine}</div>
        <div style="margin-top:10px;font-weight:700;font-size:1.15rem;">Quoted total: £${Number(total || 0).toFixed(2)}</div>
      </div>
      <p style="color:#555;margin:0 0 8px;"><b>Items:</b></p>
      <ul style="margin:0 0 12px;padding-left:20px;color:#444;">${itemSummary}</ul>
      ${more}
      <p style="color:#777;font-size:0.95rem;line-height:1.5;margin-top:20px;">
        If anything needs changing, reply to this email or call us and quote your reference.
      </p>
    </div>
  `;
}

export function shopEnquirySubject(payload) {
  const { orderId, total, guestInfo } = payload;
  const name = guestInfo?.name || 'Customer';
  return `[Order enquiry] ${orderId} — £${Number(total || 0).toFixed(2)} — ${name}`;
}
