import dns from "node:dns/promises";
import net from "node:net";
import punycode from "node:punycode";

const PRIVATE_CIDRS = [
  { block: "10.0.0.0", mask: 8 },
  { block: "172.16.0.0", mask: 12 },
  { block: "192.168.0.0", mask: 16 },
  { block: "127.0.0.0", mask: 8 },
  { block: "169.254.0.0", mask: 16 },
  { block: "100.64.0.0", mask: 10 }, // CGNAT
  { block: "::1", mask: 128 },
  { block: "fc00::", mask: 7 },
  { block: "fe80::", mask: 10 },
];

const ipToBuffer = (ip: string) => {
  if (net.isIPv4(ip)) return Buffer.from(ip.split(".").map((octet) => parseInt(octet, 10)));
  if (net.isIPv6(ip)) {
    const segments = ip.split(":").filter(Boolean);
    const buf = Buffer.alloc(16);
    let offset = 0;
    for (const seg of segments) {
      const value = parseInt(seg, 16);
      buf.writeUInt16BE(value, offset);
      offset += 2;
    }
    return buf;
  }
  return null;
};

const isIpInCidr = (ip: string, cidr: { block: string; mask: number }) => {
  const ipBuf = ipToBuffer(ip);
  const blockBuf = ipToBuffer(cidr.block);
  if (!ipBuf || !blockBuf || ipBuf.length !== blockBuf.length) return false;
  const byteMask = Math.floor(cidr.mask / 8);
  const bitMask = cidr.mask % 8;
  for (let i = 0; i < byteMask; i++) {
    if (ipBuf[i] !== blockBuf[i]) return false;
  }
  if (bitMask === 0) return true;
  const mask = 0xff << (8 - bitMask);
  return (ipBuf[byteMask] & mask) === (blockBuf[byteMask] & mask);
};

export const isPrivateIp = (ip: string) => PRIVATE_CIDRS.some((cidr) => isIpInCidr(ip, cidr));

export const isFqdn = (value: string) => {
  const fqdnRegex = /^(?=.{1,253}$)(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.[A-Za-z0-9-]{1,63}(?<!-))+$/;
  return fqdnRegex.test(value);
};

export const toAsciiDomain = (value: string) => {
  try {
    return punycode.toASCII(value);
  } catch {
    return value;
  }
};

export const assertPublicHostname = async (host: string) => {
  if (net.isIP(host) || !isFqdn(host)) {
    throw new Error("Only public FQDNs are allowed");
  }
  const lookups = await dns.lookup(host, { all: true, verbatim: true });
  if (lookups.length === 0) throw new Error("No DNS A/AAAA records");
  const privateHit = lookups.find((entry) => isPrivateIp(entry.address));
  if (privateHit) {
    throw new Error("Private or link-local addresses are not allowed");
  }
  return lookups.map((l) => l.address);
};
