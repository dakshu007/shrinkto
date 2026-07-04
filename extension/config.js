// ---- ShrinkTo Pro configuration --------------------------------------------
// Fill PAYMENT_LINK with your Dodo Payments product link:
//   Dashboard -> Products -> (your product) -> Share -> copy payment link.
// It looks like: https://checkout.dodopayments.com/buy/pdt_XXXXXXXXXXXX
export const CONFIG = {
  PAYMENT_LINK: "https://checkout.dodopayments.com/buy/pdt_REPLACE_ME?quantity=1",
  PRICE_TEXT: "$2",

  // Dodo Payments license endpoints (public client endpoints - no API key).
  DODO_LIVE: "https://live.dodopayments.com",
  DODO_TEST: "https://test.dodopayments.com",

  // Re-check the license this often (ms). Offline? Access is kept (grace).
  REVALIDATE_EVERY: 7 * 24 * 60 * 60 * 1000,

  SUPPORT_URL: "https://shrinkto.com/contact",
  SITE_URL: "https://shrinkto.com",
};
