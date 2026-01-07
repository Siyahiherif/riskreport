type CheckoutInput = {
  reportToken: string;
  email: string;
  companyName?: string;
};

const sanitize = (value: string) => value.replace(/[^\w@.\- ]/g, "").slice(0, 120);

export const buildCheckoutUrl = ({ reportToken, email, companyName }: CheckoutInput) => {
  const base = process.env.LS_COMPLIANCE_CHECKOUT_URL;
  if (!base) {
    throw new Error("Missing LS_COMPLIANCE_CHECKOUT_URL");
  }

  const url = new URL(base);
  const redirectBase = process.env.REPORT_BASE_URL ?? "https://cyberfacex.com";
  url.searchParams.set("checkout[success_url]", `${redirectBase}/compliance/access?token=${reportToken}`);
  url.searchParams.set("checkout[cancel_url]", `${redirectBase}/compliance`);
  url.searchParams.set("checkout[custom][reportToken]", reportToken);
  url.searchParams.set("checkout[custom][email]", sanitize(email));
  if (companyName) {
    url.searchParams.set("checkout[custom][companyName]", sanitize(companyName));
  }
  return url.toString();
};
