const dns = require('dns').promises
const http = require('http')
const https = require('https')

function isPrivateIP(ip) {
  if (!ip) return true
  // IPv4 loopback & private ranges
  if (ip === '127.0.0.1' || ip.startsWith('127.')) return true
  if (ip.startsWith('10.')) return true
  if (ip.startsWith('192.168.')) return true
  if (ip.startsWith('169.254.')) return true
  if (ip.startsWith('0.')) return true
  
  // 172.16.0.0 - 172.31.255.255
  if (ip.startsWith('172.')) {
    const parts = ip.split('.')
    const secondOctet = parseInt(parts[1], 10)
    if (secondOctet >= 16 && secondOctet <= 31) return true
  }

  // IPv6 loopback & link local
  if (ip === '::1' || ip === '0:0:0:0:0:0:0:1') return true
  if (ip.toLowerCase().startsWith('fe80:')) return true
  if (ip.toLowerCase().startsWith('fc00:') || ip.toLowerCase().startsWith('fd00:')) return true

  return false
}

async function safeFetchUrl(rawUrl) {
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) {
    throw new Error('A valid URL string is required.')
  }

  let trimmedUrl = rawUrl.trim()
  if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
    trimmedUrl = 'https://' + trimmedUrl
  }

  let parsedUrl
  try {
    parsedUrl = new URL(trimmedUrl)
  } catch (err) {
    throw new Error('Invalid URL format.')
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new Error('Only HTTP and HTTPS URLs are allowed.')
  }

  const hostname = parsedUrl.hostname.toLowerCase()

  // Block localhost and internal names directly
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname === '127.0.0.1' ||
    hostname === '::1'
  ) {
    throw new Error('Access to local/internal hostnames is blocked for security.')
  }

  // Resolve hostname to IP to prevent SSRF DNS pinning / rebinds
  let ipAddresses = []
  try {
    const lookup = await dns.lookup(hostname, { all: true })
    ipAddresses = lookup.map((entry) => entry.address)
  } catch (dnsErr) {
    throw new Error(`Unable to resolve domain: ${hostname}`)
  }

  for (const ip of ipAddresses) {
    if (isPrivateIP(ip)) {
      throw new Error(`Access to private IP range (${ip}) is blocked.`)
    }
  }

  // Fetch using fetch API with AbortController timeout & max size limit
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 6000)

  try {
    const response = await fetch(parsedUrl.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent': 'NiveshShield-Security-Analyzer/2.0 (+https://niveshshield.org)',
        'Accept': 'text/html,application/xhtml+xml,text/plain;q=0.9',
      },
      redirect: 'follow',
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Target web page responded with HTTP status ${response.status}`)
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('text/html') && !contentType.includes('text/plain') && !contentType.includes('json')) {
      throw new Error('Target URL did not return text content.')
    }

    const rawText = await response.text()
    // Truncate to 50KB to prevent memory exhaustion
    const truncatedText = rawText.slice(0, 50000)

    // Basic HTML text extraction
    const titleMatch = truncatedText.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : hostname

    // Strip HTML scripts, styles, and tags
    const cleanedText = truncatedText
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    return {
      success: true,
      url: parsedUrl.toString(),
      domain: hostname,
      title,
      extracted_text: `URL: ${parsedUrl.toString()}\nDomain: ${hostname}\nPage Title: ${title}\nContent Excerpt: ${cleanedText.slice(0, 4000)}`,
    }
  } catch (error) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error('URL fetch request timed out after 6 seconds.')
    }
    throw error
  }
}

module.exports = {
  safeFetchUrl,
}
