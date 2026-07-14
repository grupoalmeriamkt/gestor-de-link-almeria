import { UAParser } from "ua-parser-js";

export interface ParsedUA {
  device_type: string;
  browser: string;
  operating_system: string;
  is_bot: boolean;
}

const BOT_PATTERNS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /whatsapp/i,
  /facebookexternalhit/i,
  /facebot/i,
  /linkedinbot/i,
  /slackbot/i,
  /telegrambot/i,
  /twitterbot/i,
  /discordbot/i,
  /preview/i,
  /monitor/i,
  /pingdom/i,
  /headlesschrome/i,
  /python-requests/i,
  /curl\//i,
  /wget/i,
];

export function isBotUserAgent(ua: string): boolean {
  if (!ua) return true; // sem UA => tratar como bot/preview
  return BOT_PATTERNS.some((re) => re.test(ua));
}

export function parseUserAgent(ua: string): ParsedUA {
  const parser = new UAParser(ua);
  const result = parser.getResult();
  return {
    device_type: result.device.type ?? "desktop",
    browser: result.browser.name ?? "unknown",
    operating_system: result.os.name ?? "unknown",
    is_bot: isBotUserAgent(ua),
  };
}
