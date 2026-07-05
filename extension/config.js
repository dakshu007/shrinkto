// ---- ShrinkTo Pro configuration --------------------------------------------
// PAYMENT_LINK must be the FULL checkout URL (the dodo.pe short link drops
// the redirect_url param that powers auto-activation).
// NOTE: this is currently the TEST-mode product (test.checkout.*). Before
// launch, create the product in Live mode and swap in its link:
//   https://checkout.dodopayments.com/buy/pdt_XXXXXXXXXXXX?quantity=1
export const CONFIG = {
  PAYMENT_LINK: "https://test.checkout.dodopayments.com/buy/pdt_0NiTZmrZoFZS9LGhjmHQe?quantity=1",
  PRICE_TEXT: "$2",

  // Dodo Payments license endpoints (public client endpoints - no API key).
  DODO_LIVE: "https://live.dodopayments.com",
  DODO_TEST: "https://test.dodopayments.com",

  // Re-check the license this often (ms). Offline? Access is kept (grace).
  REVALIDATE_EVERY: 7 * 24 * 60 * 60 * 1000,

  SUPPORT_URL: "https://shrinkto.com/contact",
  SITE_URL: "https://shrinkto.com",

  // After checkout, Dodo redirects here; the page fetches the license key
  // and pushes it into the extension for automatic activation.
  ACTIVATED_URL: "https://shrinkto.com/extension/activated",
};

/** True while PAYMENT_LINK points at Dodo's test-mode checkout. */
export function isTestPaymentLink() {
  return CONFIG.PAYMENT_LINK.includes("test.checkout.");
}
