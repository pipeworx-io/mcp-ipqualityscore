interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * IPQualityScore MCP — wraps the IPQualityScore fraud-prevention API
 * (ipqualityscore.com).
 *
 * Fraud detection & risk scoring for IPs, emails, phone numbers, and URLs:
 * - check_ip:    is this IP a proxy / VPN / Tor exit / bot? + fraud score, geo
 * - check_email: email deliverability, disposable / leaked / fraud check
 * - check_phone: phone validation — active, VOIP, prepaid, line type, carrier
 * - check_url:   URL safety scan — phishing, malware, spam, domain reputation
 *
 * Dual-key model: pass your own IPQualityScore key via _apiKey for higher
 * limits, or omit it to use the shared Pipeworx key. The key is part of the
 * URL PATH (IPQualityScore's convention), not a header or query param.
 */


const BASE_URL = 'https://ipqualityscore.com/api/json';

type ApiResult = unknown;

const tools: McpToolExport['tools'] = [
  {
    name: 'check_ip',
    description:
      'Fraud detection & risk scoring for an IP address. Answers "is this IP a proxy, VPN, or Tor exit node?", flags bots/crawlers and recent abuse, and returns a 0-100 fraud score plus geolocation (country, region, city, ISP, connection type). Example: check_ip({ ip: "8.8.8.8", strictness: 1 })',
    inputSchema: {
      type: 'object' as const,
      properties: {
        ip: {
          type: 'string',
          description: 'IPv4 or IPv6 address to check, e.g. "8.8.8.8"',
        },
        strictness: {
          type: 'number',
          description:
            'Detection strictness 0, 1, or 2. Higher = more aggressive proxy/VPN detection (more false positives). Default 1.',
        },
        _apiKey: {
          type: 'string',
          description:
            'Optional — your own IPQualityScore API key for higher limits; omit to use the shared Pipeworx key.',
        },
      },
      required: ['ip'],
    },
  },
  {
    name: 'check_email',
    description:
      'Email fraud & deliverability check. Validates an email address, detects disposable/temporary addresses, flags emails seen in data leaks, and returns a 0-100 fraud score plus deliverability, SMTP, and DNS validity signals. Example: check_email({ email: "user@example.com" })',
    inputSchema: {
      type: 'object' as const,
      properties: {
        email: {
          type: 'string',
          description: 'Email address to validate, e.g. "user@example.com"',
        },
        _apiKey: {
          type: 'string',
          description:
            'Optional — your own IPQualityScore API key for higher limits; omit to use the shared Pipeworx key.',
        },
      },
      required: ['email'],
    },
  },
  {
    name: 'check_phone',
    description:
      'Phone number validation & fraud check. Confirms whether a number is valid and active, returns a 0-100 fraud score, and flags VOIP, prepaid, and risky numbers with line type, carrier, and region. Example: check_phone({ phone: "18007267864", country: "US" })',
    inputSchema: {
      type: 'object' as const,
      properties: {
        phone: {
          type: 'string',
          description: 'Phone number to validate, e.g. "18007267864" or "+1 800 726 7864"',
        },
        country: {
          type: 'string',
          description: 'Optional 2-letter ISO country code to improve parsing, e.g. "US", "GB".',
        },
        _apiKey: {
          type: 'string',
          description:
            'Optional — your own IPQualityScore API key for higher limits; omit to use the shared Pipeworx key.',
        },
      },
      required: ['phone'],
    },
  },
  {
    name: 'check_url',
    description:
      'URL / malware safety scan. Checks whether a URL or domain is unsafe — phishing, malware, spam — and returns a risk score, domain reputation rank, content category, DNS validity, and domain age. Example: check_url({ url: "https://example.com" })',
    inputSchema: {
      type: 'object' as const,
      properties: {
        url: {
          type: 'string',
          description: 'Full URL or domain to scan, e.g. "https://example.com"',
        },
        _apiKey: {
          type: 'string',
          description:
            'Optional — your own IPQualityScore API key for higher limits; omit to use the shared Pipeworx key.',
        },
      },
      required: ['url'],
    },
  },
];

// IPQualityScore puts the API key in the URL PATH, and the lookup target
// (ip / email / phone / url) is also a path segment — both must be encoded.
async function ipqsGet(path: string, params?: URLSearchParams): Promise<{ ok: boolean; status: number; body: ApiResult; text: string }> {
  const qs = params?.toString();
  const url = `${BASE_URL}${path}${qs ? `?${qs}` : ''}`;
  const res = await fetch(url);
  const text = await res.text();
  let body: ApiResult = text;
  try {
    body = JSON.parse(text);
  } catch {
    // leave body as raw text
  }
  return { ok: res.ok, status: res.status, body, text };
}

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const apiKey = args._apiKey as string;
  delete args._apiKey;

  if (!apiKey) {
    return { error: 'api_key_required', message: 'No IPQualityScore key available.' };
  }
  const key = encodeURIComponent(apiKey);

  switch (name) {
    case 'check_ip':
      return checkIp(key, args);
    case 'check_email':
      return checkEmail(key, args);
    case 'check_phone':
      return checkPhone(key, args);
    case 'check_url':
      return checkUrl(key, args);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function checkIp(key: string, args: Record<string, unknown>): Promise<unknown> {
  const ip = (args.ip as string) ?? '';
  const strictness = args.strictness == null ? 1 : (args.strictness as number);
  const params = new URLSearchParams({ strictness: String(strictness) });
  const { ok, status, body, text } = await ipqsGet(`/ip/${key}/${encodeURIComponent(ip)}`, params);
  if (!ok) return { error: status, message: text };

  const data = body as Record<string, unknown>;
  return {
    ip,
    fraud_score: data.fraud_score,
    proxy: data.proxy,
    vpn: data.vpn,
    tor: data.tor,
    is_crawler: data.is_crawler,
    bot_status: data.bot_status,
    recent_abuse: data.recent_abuse,
    country_code: data.country_code,
    region: data.region,
    city: data.city,
    ISP: data.ISP,
    organization: data.organization,
    connection_type: data.connection_type,
  };
}

async function checkEmail(key: string, args: Record<string, unknown>): Promise<unknown> {
  const email = (args.email as string) ?? '';
  const { ok, status, body, text } = await ipqsGet(`/email/${key}/${encodeURIComponent(email)}`);
  if (!ok) return { error: status, message: text };

  const data = body as Record<string, unknown>;
  const firstSeen = data.first_seen as { human?: unknown } | undefined;
  return {
    email,
    valid: data.valid,
    disposable: data.disposable,
    deliverability: data.deliverability,
    fraud_score: data.fraud_score,
    leaked: data.leaked,
    suspect: data.suspect,
    recent_abuse: data.recent_abuse,
    first_seen: firstSeen?.human,
    smtp_score: data.smtp_score,
    dns_valid: data.dns_valid,
  };
}

async function checkPhone(key: string, args: Record<string, unknown>): Promise<unknown> {
  const phone = (args.phone as string) ?? '';
  const country = args.country as string | undefined;
  const params = new URLSearchParams();
  if (country) params.set('country', country);
  const { ok, status, body, text } = await ipqsGet(
    `/phone/${key}/${encodeURIComponent(phone)}`,
    params.toString() ? params : undefined,
  );
  if (!ok) return { error: status, message: text };

  const data = body as Record<string, unknown>;
  return {
    phone,
    valid: data.valid,
    active: data.active,
    fraud_score: data.fraud_score,
    recent_abuse: data.recent_abuse,
    VOIP: data.VOIP,
    prepaid: data.prepaid,
    risky: data.risky,
    line_type: data.line_type,
    carrier: data.carrier,
    country: data.country,
    region: data.region,
  };
}

async function checkUrl(key: string, args: Record<string, unknown>): Promise<unknown> {
  const url = (args.url as string) ?? '';
  const { ok, status, body, text } = await ipqsGet(`/url/${key}/${encodeURIComponent(url)}`);
  if (!ok) return { error: status, message: text };

  const data = body as Record<string, unknown>;
  const domainAge = data.domain_age as { human?: unknown } | undefined;
  return {
    url,
    unsafe: data.unsafe,
    domain_rank: data.domain_rank,
    dns_valid: data.dns_valid,
    suspicious: data.suspicious,
    phishing: data.phishing,
    malware: data.malware,
    spamming: data.spamming,
    risk_score: data.risk_score,
    category: data.category,
    domain_age: domainAge?.human,
  };
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
