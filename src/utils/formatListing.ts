"use strict";

/** Escape user-provided text so it is safe inside Telegram HTML messages. */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Make @usernames clickable; show phone numbers / other text as-is. */
function formatContact(contact) {
  if (contact.startsWith("@")) {
    const username = contact.slice(1);
    return `<a href="https://t.me/${escapeHtml(username)}">${escapeHtml(contact)}</a>`;
  }
  return escapeHtml(contact);
}

/**
 * Builds the final listing text (used as the photo caption, HTML parse mode).
 * The SAME text is shown to admins and posted to the channel.
 */
function formatPost(sub) {
  const hashtags = `#${sub.category.tag} #${sub.location.tag} #Available`;

  return [
    `🛍 <b>${escapeHtml(sub.name)}</b>`,
    "",
    `📂 <b>Category:</b> ${escapeHtml(sub.category.label)}`,
    `📍 <b>Location:</b> ${escapeHtml(sub.location.name)}`,
    `💰 <b>Price:</b> ${escapeHtml(sub.price)}`,
    `🔧 <b>Condition:</b> ${escapeHtml(sub.condition)}`,
    `📞 <b>Contact:</b> ${formatContact(sub.contact)}`,
    "",
    hashtags,
  ].join("\n");
}

module.exports = { escapeHtml, formatPost };
