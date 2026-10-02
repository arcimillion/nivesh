export type FindingType =
  | 'guaranteedReturns'
  | 'urgency'
  | 'upfrontPayment'
  | 'suspiciousLink'

export type Finding = {
  type: FindingType
  excerpt: string
}

export function analyzeDemoMessage(message: string): Finding[] {
  const findings: Finding[] = []

  const patterns: {
    type: FindingType
    regex: RegExp
  }[] = [
    {
      type: 'guaranteedReturns',
      regex:
        /(guaranteed|guarantee|fixed return|assured return|100% profit|daily profit|गारंटीड|गारंटी|निश्चित रिटर्न|पक्का मुनाफा)/i,
    },
    {
      type: 'urgency',
      regex:
        /(act now|limited time|urgent|immediately|today only|last chance|अभी करें|तुरंत|आज ही|आखिरी मौका)/i,
    },
    {
      type: 'upfrontPayment',
      regex:
        /(pay first|registration fee|deposit|send money|upfront|पहले पैसे|रजिस्ट्रेशन फीस|डिपॉजिट|पैसे भेजें)/i,
    },
    {
      type: 'suspiciousLink',
      regex:
        /(https?:\/\/|bit\.ly|tinyurl|t\.me\/|download app|apk|ऐप डाउनलोड|लिंक पर क्लिक)/i,
    },
  ]

  for (const pattern of patterns) {
    const match = message.match(pattern.regex)

    if (match) {
      findings.push({
        type: pattern.type,
        excerpt: match[0],
      })
    }
  }

  return findings
}