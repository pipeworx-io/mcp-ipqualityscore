# mcp-ipqualityscore

IPQualityScore MCP — wraps the IPQualityScore fraud-prevention API

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `check_ip` | Fraud detection & risk scoring for an IP address. Answers "is this IP a proxy, VPN, or Tor exit node?", flags bots/crawlers and recent abuse, and returns a 0-100 fraud score plus geolocation (country, region, city, ISP, connection type). Example: check_ip({ ip: "8.8.8.8", strictness: 1 }) |
| `check_email` | Email fraud & deliverability check. Validates an email address, detects disposable/temporary addresses, flags emails seen in data leaks, and returns a 0-100 fraud score plus deliverability, SMTP, and DNS validity signals. Example: check_email({ email: "user@example.com" }) |
| `check_phone` | Phone number validation & fraud check. Confirms whether a number is valid and active, returns a 0-100 fraud score, and flags VOIP, prepaid, and risky numbers with line type, carrier, and region. Example: check_phone({ phone: "18007267864", country: "US" }) |
| `check_url` | URL / malware safety scan. Checks whether a URL or domain is unsafe — phishing, malware, spam — and returns a risk score, domain reputation rank, content category, DNS validity, and domain age. Example: check_url({ url: "https://example.com" }) |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "ipqualityscore": {
      "url": "https://gateway.pipeworx.io/ipqualityscore/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Ipqualityscore data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
