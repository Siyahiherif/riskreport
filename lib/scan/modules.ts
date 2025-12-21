import dns from "node:dns/promises";
import tls from "node:tls";

import { findingWeights } from "../constants";
import { Finding } from "../types";
import { assertPublicHostname, isPrivateIp } from "./security";

const daysUntil = (date: string | number | Date) =>
  Math.round((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

const toFinding = (partial: Omit<Finding, "weight">): Finding => ({
  weight: findingWeights[partial.id] ?? 0,
  status: partial.status ?? "ok",
  ...partial,
});

const withTimeout = async <T>(p: Promise<T>, ms = 5000): Promise<T> => {
  let timeout: NodeJS.Timeout;
  const t = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error("DNS timeout")), ms);
  });
  const result = await Promise.race([p, t]);
  clearTimeout(timeout!);
  return result;
};

const resolveTxtWithResolvers = async (host: string): Promise<{ values: string[]; resolver: string }> => {
  const publicResolver = new dns.Resolver();
  publicResolver.setServers(["1.1.1.1", "8.8.8.8"]);
  try {
    const values = await withTimeout(dns.resolveTxt(host));
    return { values: values.flat(), resolver: "system" };
  } catch {
    const values = await withTimeout(publicResolver.resolveTxt(host));
    return { values: values.flat(), resolver: "public(1.1.1.1/8.8.8.8)" };
  }
};

export async function runDnsChecks(domain: string): Promise<Finding[]> {
  const findings: Finding[] = [];
  await assertPublicHostname(domain);

  // SPF
  try {
    const { values, resolver } = await resolveTxtWithResolvers(domain);
    const flat = values.join(" ");
    if (!/v=spf1/i.test(flat)) {
      findings.push(
        toFinding({
          id: "SPF_MISSING",
          category: "email_security",
          severity: "high",
          title: "SPF record is missing",
          summary: "The domain does not publish an SPF policy.",
          business_impact: "Increases risk of email spoofing and invoice fraud using your domain.",
          evidence: `No TXT record containing "v=spf1" found for ${domain} (resolver: ${resolver})`,
          recommendation: [
            "Publish an SPF record that lists your authorized mail senders",
            "Align SPF with DMARC by setting an explicit policy",
          ],
          references: ["SPF RFC 7208"],
        })
      );
    }
  } catch (err) {
    findings.push(
      toFinding({
        id: "SPF_MISSING",
        category: "email_security",
        severity: "high",
        title: "SPF record is missing",
        summary: "The domain does not publish an SPF policy.",
        business_impact: "Increases risk of email spoofing and invoice fraud using your domain.",
        evidence: `TXT lookup for ${domain} failed (${(err as Error).message})`,
        status: "failed",
        error_hint: "TXT query failed; ensure DNS reachable publicly.",
        recommendation: [
          "Publish an SPF record that lists your authorized mail senders",
          "Align SPF with DMARC by setting an explicit policy",
        ],
        references: ["SPF RFC 7208"],
      })
    );
  }

  // DMARC
  const dmarcHost = `_dmarc.${domain}`;
  try {
    const { values, resolver } = await resolveTxtWithResolvers(dmarcHost);
    const record = values.join(" ");
    if (!/v=DMARC1/i.test(record)) {
      throw new Error("DMARC tag missing");
    }
    const policyMatch = record.match(/p=([^;]+)/i);
    const policy = policyMatch?.[1]?.toLowerCase() ?? "none";
    if (policy === "none") {
      findings.push(
        toFinding({
          id: "DMARC_POLICY_NONE",
          category: "email_security",
          severity: "medium",
          title: "DMARC policy set to none",
          summary: "DMARC record exists but policy is set to monitoring only (p=none).",
          business_impact: "Spoofed emails may still be delivered because the policy does not enforce rejection.",
          evidence: `DMARC record found via ${resolver}: ${record}`,
          recommendation: [
            "Move DMARC policy to p=quarantine or p=reject after monitoring",
            "Ensure SPF and DKIM are aligned before enforcing",
          ],
          references: ["DMARC RFC 7489"],
        })
      );
    }
  } catch (err) {
    findings.push(
      toFinding({
        id: "DMARC_MISSING",
        category: "email_security",
        severity: "high",
        title: "DMARC policy is missing",
        summary: "No DMARC record was found for the domain.",
        business_impact: "Attackers can spoof your domain to send fake invoices or payment requests.",
        evidence: `No TXT record found for ${dmarcHost} (${(err as Error).message})`,
        status: "failed",
        error_hint: "DMARC lookup failed or missing",
        recommendation: [
          "Publish a DMARC record with p=quarantine or p=reject",
          "Ensure SPF and DKIM are correctly aligned",
        ],
        references: ["DMARC RFC 7489"],
      })
    );
  }

  // MX presence (informational)
  try {
    const mxRecords = await withTimeout(dns.resolveMx(domain));
    const privateMx = mxRecords.find((r) => isPrivateIp(r.exchange));
    if (privateMx) {
      findings.push(
        toFinding({
          id: "MX_PRIVATE",
          category: "email_security",
          severity: "medium",
          title: "MX points to private address",
          summary: "One or more MX records resolve to non-public addresses.",
          business_impact: "Mail delivery may fail or expose internal infrastructure.",
          evidence: `Private MX detected: ${privateMx.exchange}`,
          recommendation: ["Ensure MX records point to publicly reachable mail exchangers."],
        })
      );
    }
  } catch (err) {
    findings.push(
      toFinding({
        id: "MX_MISSING",
        category: "email_security",
        severity: "info",
        title: "No MX records found",
        summary: "Domain has no MX records; outbound-only domains may ignore this.",
        business_impact: "If you intend to receive mail, delivery will fail.",
        evidence: `MX lookup failed (${(err as Error).message})`,
        status: "failed",
        error_hint: "MX lookup failed",
        recommendation: ["Add MX records for your mail provider if inbound mail is expected."],
      })
    );
  }

  // DKIM note (informational)
  findings.push(
    toFinding({
      id: "DKIM_NOTE",
      category: "email_security",
      severity: "info",
      title: "DKIM validation varies by selector",
      summary: "Selectors are provider-specific; verification not performed in this passive check.",
      business_impact: "Missing DKIM alignment weakens DMARC enforcement.",
      evidence: "DKIM selectors were not probed to avoid false positives.",
      recommendation: [
        "Ensure DKIM is enabled with strong keys for all sending services",
        "Align DKIM with DMARC for enforcement",
      ],
      references: ["DKIM RFC 6376"],
    })
  );

  return findings;
}

const tlsHandshake = (domain: string) =>
  new Promise<tls.PeerCertificate>((resolve, reject) => {
    const socket = tls.connect(
      {
        host: domain,
        servername: domain,
        port: 443,
        minVersion: "TLSv1.2",
        rejectUnauthorized: false,
      },
      () => {
        const cert = socket.getPeerCertificate();
        socket.end();
        if (!cert || !cert.valid_to) {
          reject(new Error("No certificate"));
          return;
        }
        resolve(cert);
      }
    );
    socket.on("error", reject);
    socket.setTimeout(8000, () => {
      socket.destroy(new Error("TLS handshake timeout"));
    });
  });

export async function runTlsChecks(domain: string): Promise<Finding[]> {
  const findings: Finding[] = [];
  await assertPublicHostname(domain);

  try {
    const cert = await tlsHandshake(domain);
    const days = daysUntil(cert.valid_to);
    if (days < 0) {
      findings.push(
        toFinding({
          id: "SSL_EXPIRED",
          category: "transport_security",
          severity: "high",
          title: "TLS certificate is expired",
          summary: "The leaf certificate has passed its validity period.",
          business_impact: "Users may see browser warnings; traffic can be intercepted via MITM.",
          evidence: `Certificate expired on ${cert.valid_to}`,
          recommendation: ["Renew the TLS certificate immediately.", "Automate certificate renewal (e.g., ACME)."],
        })
      );
    } else if (days < 14) {
      findings.push(
        toFinding({
          id: "SSL_EXPIRING_SOON",
          category: "transport_security",
          severity: "medium",
          title: "TLS certificate expires soon",
          summary: "The certificate validity ends within 14 days.",
          business_impact: "Risk of service disruption and user trust loss if renewal is missed.",
          evidence: `Certificate expires on ${cert.valid_to} (${days} days remaining)`,
          recommendation: ["Renew the TLS certificate before expiry.", "Implement automated renewal checks."],
        })
      );
    }
  } catch (err) {
    findings.push(
      toFinding({
        id: "TLS_HANDSHAKE_FAILED",
        category: "transport_security",
        severity: "high",
        title: "HTTPS endpoint is unreachable",
        summary: "TLS handshake failed; HTTPS may not be correctly configured.",
        business_impact: "Users may fall back to HTTP or be unable to reach the service securely.",
        evidence: `TLS handshake failed for ${domain}: ${(err as Error).message}`,
        status: "failed",
        error_hint: "TLS unreachable or misconfigured",
        recommendation: ["Ensure port 443 is open and serving a valid certificate.", "Verify TLS configuration supports TLS 1.2+"],
      })
    );
  }

  return findings;
}

export async function runHeaderChecks(domain: string): Promise<Finding[]> {
  const findings: Finding[] = [];
  let response: Response | null = null;
  await assertPublicHostname(domain);

  try {
    response = await fetch(`https://${domain}`, {
      method: "GET",
      redirect: "follow",
      headers: { "User-Agent": "RiskReportBot/1.0" },
    });
  } catch (err) {
    findings.push(
      toFinding({
        id: "HTTPS_FETCH_FAILED",
        category: "web_security",
        severity: "high",
        title: "Unable to fetch HTTPS response",
        summary: "Failed to retrieve the homepage over HTTPS.",
        business_impact: "Automated clients and browsers may not reach the site reliably.",
        evidence: `Fetch to https://${domain} failed: ${(err as Error).message}`,
        status: "failed",
        error_hint: "HTTPS fetch failed",
        recommendation: ["Ensure HTTPS is reachable and responses are returned with status 200/301."],
      })
    );
    return findings;
  }

  const headers = response.headers;
  const status = response.status;

  if (status >= 400) {
    findings.push(
      toFinding({
        id: "HTTP_STATUS_ERROR",
        category: "hygiene",
        severity: "medium",
        title: "Homepage returned an error status",
        summary: `The root path responded with status ${status}.`,
        business_impact: "Users may experience downtime or broken landing pages.",
        evidence: `GET https://${domain} -> ${status}`,
        recommendation: ["Ensure the homepage returns 200/301 for availability checks."],
      })
    );
  }

  const missingHeader = (name: string) => !headers.get(name);

  if (missingHeader("strict-transport-security")) {
    findings.push(
      toFinding({
        id: "HSTS_MISSING",
        category: "transport_security",
        severity: "medium",
        title: "HSTS header is missing",
        summary: "Strict-Transport-Security is not set, so browsers may downgrade to HTTP.",
        business_impact: "Opens opportunity for SSL stripping and downgrade attacks.",
        evidence: "No Strict-Transport-Security header detected.",
        recommendation: [
          'Add Strict-Transport-Security: max-age=15552000; includeSubDomains; preload',
          "Submit the domain to the HSTS preload list after testing.",
        ],
      })
    );
  }

  if (missingHeader("content-security-policy")) {
    findings.push(
      toFinding({
        id: "CSP_MISSING",
        category: "web_security",
        severity: "medium",
        title: "Content Security Policy is missing",
        summary: "No CSP header was found on the homepage response.",
        business_impact: "Increases exposure to XSS and data exfiltration in the browser.",
        evidence: "No Content-Security-Policy header detected.",
        recommendation: [
          "Define a CSP that restricts scripts, styles, images, and connections to trusted origins",
          "Start with a report-only mode, then enforce after validating",
        ],
      })
    );
  }

  if (missingHeader("x-frame-options")) {
    findings.push(
      toFinding({
        id: "XFO_MISSING",
        category: "web_security",
        severity: "low",
        title: "X-Frame-Options is missing",
        summary: "The response does not prevent clickjacking via iframes.",
        business_impact: "Attackers could frame your site to trick users into unintended actions.",
        evidence: "No X-Frame-Options header detected.",
        recommendation: ["Set X-Frame-Options: DENY or SAMEORIGIN depending on embedding needs."],
      })
    );
  }

  if (missingHeader("x-content-type-options")) {
    findings.push(
      toFinding({
        id: "XCTO_MISSING",
        category: "web_security",
        severity: "low",
        title: "X-Content-Type-Options is missing",
        summary: "The response does not include X-Content-Type-Options: nosniff.",
        business_impact: "Browsers may MIME-sniff content, increasing XSS risk.",
        evidence: "No X-Content-Type-Options header detected.",
        recommendation: ["Set X-Content-Type-Options: nosniff on all responses."],
      })
    );
  }

  if (missingHeader("referrer-policy")) {
    findings.push(
      toFinding({
        id: "REFERRER_POLICY_MISSING",
        category: "web_security",
        severity: "low",
        title: "Referrer-Policy header is missing",
        summary: "Referrer information may leak full URLs to third parties.",
        business_impact: "Sensitive query parameters could be exposed in outbound requests.",
        evidence: "No Referrer-Policy header detected.",
        recommendation: ["Set Referrer-Policy: strict-origin-when-cross-origin or stricter."],
      })
    );
  }

  const serverHeader = headers.get("server");
  if (serverHeader) {
    findings.push(
      toFinding({
        id: "SERVER_HEADER_PRESENT",
        category: "web_security",
        severity: "info",
        title: "Server header exposes technology",
        summary: "The response includes a Server header that may reveal stack details.",
        business_impact: "Exposed versions can aid attackers in targeting known exploits.",
        evidence: `Server header: ${serverHeader}`,
        recommendation: ["Remove or neutralize the Server header if supported by your platform."],
      })
    );
  }

  return findings;
}

export async function runRedirectChecks(domain: string): Promise<Finding[]> {
  const findings: Finding[] = [];
  await assertPublicHostname(domain);
  try {
    const response = await fetch(`http://${domain}`, {
      method: "GET",
      redirect: "manual",
      headers: { "User-Agent": "RiskReportBot/1.0" },
    });

    const status = response.status;
    const location = response.headers.get("location") ?? "";

    if (status >= 300 && status < 400) {
      const goesToHttps = location.startsWith(`https://${domain}`) || location.startsWith("https://");
      if (!goesToHttps) {
        findings.push(
          toFinding({
            id: "HTTPS_NOT_ENFORCED",
            category: "hygiene",
            severity: "high",
            title: "HTTP is not redirected to HTTPS",
            summary: "Requests over HTTP are not forced to HTTPS for the same host.",
            business_impact: "Users may stay on insecure HTTP, enabling interception or tampering.",
            evidence: `GET http://${domain} -> ${status} Location: ${location}`,
            recommendation: ["Add a 301 redirect from HTTP to HTTPS at the edge/load balancer."],
          })
        );
      }
    } else {
      findings.push(
        toFinding({
          id: "HTTPS_NOT_ENFORCED",
          category: "hygiene",
          severity: "high",
          title: "HTTP is not redirected to HTTPS",
          summary: "The HTTP endpoint did not issue a redirect to HTTPS.",
          business_impact: "Users may remain on insecure HTTP connections.",
          evidence: `GET http://${domain} returned ${status} without redirect`,
          recommendation: ["Enforce 301 redirects from HTTP to HTTPS.", "Consider HSTS preload after enabling redirects."],
        })
      );
    }
  } catch (err) {
    findings.push(
      toFinding({
        id: "HTTP_FETCH_FAILED",
        category: "hygiene",
        severity: "medium",
        title: "HTTP endpoint not reachable",
        summary: "Could not connect to the HTTP endpoint for redirect testing.",
        business_impact: "Clients using plain HTTP may fail to reach your site or downgrade protection.",
        evidence: `Fetch to http://${domain} failed: ${(err as Error).message}`,
        status: "failed",
        error_hint: "HTTP fetch failed; redirect check skipped",
        recommendation: ["Ensure HTTP is reachable and issues a 301 to HTTPS."],
      })
    );
  }

  return findings;
}
