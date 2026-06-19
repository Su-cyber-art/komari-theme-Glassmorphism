const ASN_PREFIX_WITH_SPACE_REGEX = /^AS\d+\s*/i

const FALLBACK_PROVIDER_MAP: Array<[RegExp, string]> = [
  [/digitalocean|digital ocean|do\./i, 'DigitalOcean'],
  [/vultr/i, 'Vultr'],
  [/linode/i, 'Linode'],
  [/aws|amazon web services|amazon.com/i, 'AWS'],
  [/azure|microsoft/i, 'Microsoft Azure'],
  [/google cloud|google/i, 'Google Cloud'],
  [/aliyun|阿里云/i, 'Alibaba Cloud'],
  [/tencent|腾讯云/i, 'Tencent Cloud'],
  [/huawei|华为云/i, 'Huawei Cloud'],
  [/oracle/i, 'Oracle Cloud'],
  [/ovh/i, 'OVH'],
  [/hetzner/i, 'Hetzner'],
  [/rackspace/i, 'Rackspace'],
]

export async function fetchProviderInfo(ip: string): Promise<string> {
  if (!ip)
    return ''

  const normalizedIp = ip.trim()
  if (!normalizedIp)
    return ''

  try {
    const response = await fetch(`https://ipinfo.io/${encodeURIComponent(normalizedIp)}/json`, {
      method: 'GET',
      cache: 'no-store',
    })

    if (!response.ok)
      return ''

    const data = await response.json() as { org?: string, hostname?: string, city?: string, region?: string, country?: string }
    const org = data.org?.trim()
    if (org) {
      return org.replace(ASN_PREFIX_WITH_SPACE_REGEX, '').trim()
    }

    return ''
  }
  catch {
    return ''
  }
}

export function detectProvider(regionStr: string): string {
  const normalized = regionStr.trim()
  if (!normalized)
    return '未知供应商'

  const lower = normalized.toLowerCase()
  for (const [pattern, provider] of FALLBACK_PROVIDER_MAP) {
    if (pattern.test(lower))
      return provider
  }

  return normalized
}
