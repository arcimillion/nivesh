import dns from 'node:dns/promises'
import * as cheerio from 'cheerio'

export function isPrivateIP(ip: string): boolean {
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

// 1. URL Validator & SSRF Preventer
export function isSafePublicUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString)

    // Only allow HTTP/HTTPS
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false

    const hostname = url.hostname

    // Block common private/local IP ranges (SSRF Protection)
    const privateIpRegex =
      /^(localhost|127\.0\.0\.1|0\.0\.0\.0|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|169\.254\.\d{1,3}\.\d{1,3})$/i

    if (privateIpRegex.test(hostname)) return false

    return true
  } catch {
    return false // Invalid URL format
  }
}

// 2. The Text Extractor
export async function extractTextFromUrl(url: string): Promise<string> {
  let urlToUse = url.trim()
  if (!urlToUse.startsWith('http://') && !urlToUse.startsWith('https://')) {
    urlToUse = 'https://' + urlToUse
  }

  if (!isSafePublicUrl(urlToUse)) {
    throw new Error('🔴 RED: Invalid or blocked URL detected.')
  }

  // Resolve hostname to IP to prevent SSRF DNS pinning / rebinds
  try {
    const parsed = new URL(urlToUse)
    const lookup = await dns.lookup(parsed.hostname, { all: true })
    for (const entry of lookup) {
      if (isPrivateIP(entry.address)) {
        throw new Error('🔴 RED: Invalid or blocked URL detected.')
      }
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('🔴 RED:')) {
      throw err
    }
  }

  try {
    // Fetch the raw HTML with a timeout to prevent hanging
    const response = await fetch(urlToUse, {
      signal: AbortSignal.timeout(5000),
      headers: {
        'User-Agent': 'NiveshShield-Security-Analyzer/2.0 (+https://niveshshield.org)',
        'Accept': 'text/html,application/xhtml+xml,text/plain;q=0.9',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP status ${response.status}`)
    }

    const html = await response.text()

    // Load HTML and remove scripts/styles
    const $ = cheerio.load(html)
    $('script, style, noscript, iframe, img, svg').remove()

    // Extract clean text
    const cleanText = $('body').text().replace(/\s+/g, ' ').trim()

    // Truncate to avoid blowing up the LLM context window
    return cleanText.substring(0, 8000)
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('🔴 RED:')) {
      throw error
    }
    throw new Error('🔴 RED: Unable to access the provided link. Treat with extreme caution.', { cause: error })
  }
}

export interface FetchedUrlResult {
  success: boolean
  url: string
  domain: string
  title: string
  extracted_text: string
}

export async function safeFetchUrl(rawUrl: string): Promise<FetchedUrlResult> {
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) {
    throw new Error('A valid URL string is required.')
  }

  let urlToUse = rawUrl.trim()
  if (!urlToUse.startsWith('http://') && !urlToUse.startsWith('https://')) {
    urlToUse = 'https://' + urlToUse
  }

  const cleanText = await extractTextFromUrl(urlToUse)
  const parsedUrl = new URL(urlToUse)

  return {
    success: true,
    url: urlToUse,
    domain: parsedUrl.hostname,
    title: parsedUrl.hostname,
    extracted_text: `URL: ${parsedUrl.toString()}\nDomain: ${parsedUrl.hostname}\nPage Content: ${cleanText}`,
  }
}
