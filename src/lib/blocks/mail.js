import { blocksClient } from "./client";

// Sends a contact-form message to a portfolio owner's inbox through the
// tenant's mail provider. The platform template `PortfolioContact` (language
// "en") renders FromName/FromEmail/Message; replyTo points back at the
// visitor so the owner can just hit Reply.
export async function sendContactEmail({
  ownerEmail,
  fromName,
  fromEmail,
  message,
}) {
  return blocksClient.mail.send({
    to: [ownerEmail],
    replyTo: [fromEmail],
    language: "en",
    purpose: "PortfolioContact",
    subjectDataContext: { FromName: fromName, FromEmail: fromEmail },
    bodyDataContext: {
      FromName: fromName,
      FromEmail: fromEmail,
      Message: message,
    },
  });
}
