# mcp-ipqualityscore

IPQualityScore MCP — wraps the IPQualityScore fraud-prevention API (ipqualityscore.com).

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1856+ live data sources. This is an independent, unofficial integration — not affiliated with, endorsed by, or published by the upstream provider.

## Tools

| Tool | Description |
|------|-------------|
| `check_ip` | Fraud detection & risk scoring for an IP address. Answers "is this IP a proxy, VPN, or Tor exit node?", flags bots/crawlers and recent abuse, and returns a 0-100 fraud score plus geolocation (country, region, city, ISP, connection type). Example: check_ip({ ip: "8.8.8.8", strictness: 1 }) Requires your own IPQualityScore API key, passed as _apiKey. |
| `check_email` | Email fraud & deliverability check. Validates an email address, detects disposable/temporary addresses, flags emails seen in data leaks, and returns a 0-100 fraud score plus deliverability, SMTP, and DNS validity signals. Example: check_email({ email: "user@example.com" }) Requires your own IPQualityScore API key, passed as _apiKey. |
| `check_phone` | Phone number validation & fraud check. Confirms whether a number is valid and active, returns a 0-100 fraud score, and flags VOIP, prepaid, and risky numbers with line type, carrier, and region. Example: check_phone({ phone: "18007267864", country: "US" }) Requires your own IPQualityScore API key, passed as _apiKey. |
| `check_url` | URL / malware safety scan. Checks whether a URL or domain is unsafe — phishing, malware, spam — and returns a risk score, domain reputation rank, content category, DNS validity, and domain age. Example: check_url({ url: "https://example.com" }) Requires your own IPQualityScore API key, passed as _apiKey. |

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

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/ipqualityscore/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1856+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## No MCP client? Call it over HTTP

This pack takes your own API key (`_apiKey`) — we don't front one for it, so there's no curl here that would run without it. Inspect any tool: `GET https://gateway.pipeworx.io/v1/tools/ipqualityscore_check_ip`. Find one: `POST https://gateway.pipeworx.io/v1/tools/search_packs` with `{"query":"..."}`.

## Run it from npm

`@pipeworx/mcp-ipqualityscore` is a local stdio bridge to the Pipeworx gateway: your MCP client
starts it with `npx`, and it forwards every call to the same
`https://gateway.pipeworx.io/ipqualityscore/mcp` endpoint shown above. It needs network access;
there is no offline mode.

```json
{
  "mcpServers": {
    "ipqualityscore": {
      "command": "npx",
      "args": ["-y", "@pipeworx/mcp-ipqualityscore"]
    }
  }
}
```

Without a key it calls anonymously, capped at 50 calls a day. A free account
raises that to 200 a day: get a key at https://pipeworx.io/signup and add
`"env": { "PIPEWORX_API_KEY": "<your key>" }` to the server entry.
The key is sent as a Bearer token, the same way a hosted connection sends it,
so calls are metered and billed exactly as they are there.

It lists **only** this pack's tools by default. Set `PIPEWORX_META_TOOLS=1` to
also list `ask_pipeworx` and the other gateway-wide tools.

Behind an HTTPS proxy: Node's built-in `fetch` does not read `HTTPS_PROXY` by
default. Newer Node releases honour it when `NODE_USE_ENV_PROXY=1` is set; check
your Node version's documentation.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Ipqualityscore data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
