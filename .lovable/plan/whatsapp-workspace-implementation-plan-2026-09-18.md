# WhatsApp workspace implementation plan

## Goal
Turn the uploaded Tutu calling workspace into a usable WhatsApp operations area while preserving its existing visual language and navigation.

## What will be built
- Import the uploaded app source and brand assets into the current project.
- Add a WhatsApp section with:
  - Inbox/conversation view with contact list, message bubbles, timestamps, delivery/read states, search, and composer.
  - Message history view with filters and delivery outcomes.
  - Templates/media/connection controls in the WhatsApp workspace.
- Add contact-entry actions so existing leads can start a WhatsApp message with their phone number prefilled.
- Add backend-safe message, template, media, history, and webhook endpoints using Lovable Cloud and the WhatsApp connector; secrets remain server-side.
- Add durable webhook inbox/idempotent status reconciliation, human-readable error handling, and audit-ready send states.
- Add route-specific metadata and verify the resulting workspace on desktop and mobile.

## Technical approach
- Keep TanStack Start routing and the uploaded app’s existing components, tokens, and shell.
- Use server functions for app-internal authenticated operations and `/api/public/whatsapp/webhook` for signed external callbacks.
- Use connector gateway calls for WhatsApp Business Cloud API; no browser-side tokens or fake success responses.
- Add database tables with explicit grants and RLS for messages, conversations, webhook events, and audit records.

## Assumptions
- The uploaded archive is the source of truth for the existing application UI.
- WhatsApp connection setup will use the managed connector flow rather than asking users to paste secrets into the browser.
- Existing lead records remain the contact source; no duplicate contacts will be created.
