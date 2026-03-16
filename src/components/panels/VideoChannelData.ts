export type Region = 'na' | 'eu' | 'latam' | 'asia' | 'me' | 'africa' | 'oc'

export type LiveChannel = {
  id: string
  name: string
  handle: string
  channelId?: string
  color: string
  desc: string
  region: Region
  fallbackVideoId?: string
  useFallbackOnly?: boolean
  defaultEnabled?: boolean
}

export const ALL_CHANNELS: LiveChannel[] = [
  // North America
  { id: 'bloomberg', name: 'Bloomberg', handle: 'markets', channelId: 'UCIALMKvObZNtJ6AmdCLP7Lg', color: 'border-blue-500', desc: '24/7 markets & business', region: 'na', fallbackVideoId: 'iEpJwprxDdk', defaultEnabled: true },
  { id: 'cnbc', name: 'CNBC', handle: 'CNBC', channelId: 'UCvJJ_dzjViJCoLf5uKUTwoA', color: 'border-yellow-500', desc: 'Markets, investing & earnings', region: 'na', fallbackVideoId: '9NyxcX3rhQs', defaultEnabled: true },
  { id: 'fox-business', name: 'Fox Business', handle: 'FoxBusiness', channelId: 'UCCXoCcu9Rp7NPbTzIvogpZg', color: 'border-red-500', desc: 'Business & financial news', region: 'na', defaultEnabled: true },
  { id: 'yahoo-finance', name: 'Yahoo Finance', handle: 'YahooFinance', channelId: 'UCEAZeUIeJs0IjQiqTCdVSIg', color: 'border-purple-500', desc: 'Real-time market coverage', region: 'na', fallbackVideoId: 'KQp-e_XQnDE', defaultEnabled: true },
  { id: 'msnbc', name: 'MSNBC', handle: 'MSNBC', channelId: 'UCaXkIU1QidjPwiAYu6GcHjg', color: 'border-sky-500', desc: 'News & political coverage', region: 'na', defaultEnabled: true },
  { id: 'newsnation', name: 'NewsNation', handle: 'NewsNationNow', color: 'border-violet-500', desc: 'Independent US news', region: 'na', defaultEnabled: true },
  { id: 'newsy', name: 'Newsy', handle: 'newsy', color: 'border-teal-500', desc: 'Straight news, no spin', region: 'na', defaultEnabled: true },
  { id: 'abc-news', name: 'ABC News', handle: 'ABCNews', channelId: 'UCBi2mrWuNuyYy4gbM6fU18Q', color: 'border-indigo-400', desc: 'US breaking news', region: 'na', defaultEnabled: true },
  { id: 'reuters', name: 'Reuters', handle: 'Reuters', channelId: 'UChqUTb7kYRX8-EiaN3XFrSQ', color: 'border-orange-400', desc: 'Wire news & markets', region: 'na', defaultEnabled: true },
  { id: 'ntd', name: 'NTD', handle: 'NTDNews', channelId: 'UCjz-4y6ts-VF2KSQX-jsnVg', color: 'border-green-400', desc: 'Independent global news', region: 'na', defaultEnabled: true },
  { id: 'oann', name: 'OAN', handle: 'OANN', channelId: 'UCNbIDJNNgaRrXOD7VllIMRQ', color: 'border-blue-300', desc: 'One America News', region: 'na', defaultEnabled: true },
  { id: 'cnbc-intl', name: 'CNBC Intl', handle: 'CNBCi', channelId: 'UCo7a6riBFJ3tkeHjvkXVOGojBQ', color: 'border-yellow-300', desc: 'International markets', region: 'na', defaultEnabled: true },
  { id: 'fox-news', name: 'Fox News', handle: 'FoxNews', color: 'border-red-400', desc: 'US news & politics', region: 'na', fallbackVideoId: 'QaftgYkG-ek' },
  { id: 'cbs-news', name: 'CBS News', handle: 'CBSNews', color: 'border-slate-400', desc: 'US network news', region: 'na', fallbackVideoId: 'R9L8sDK8iEc' },
  { id: 'nbc-news', name: 'NBC News', handle: 'NBCNews', color: 'border-cyan-400', desc: 'US network news', region: 'na', fallbackVideoId: 'yMr0neQhu6c' },
  { id: 'cbc-news', name: 'CBC News', handle: 'CBCNews', color: 'border-red-300', desc: 'Canadian public news', region: 'na', fallbackVideoId: 'jxP_h3V-Dv8' },
  // Europe
  { id: 'bbc-news', name: 'BBC News', handle: 'BBCNews', channelId: 'UC16niRr50-MSBwiO3YDb3RA', color: 'border-rose-400', desc: 'UK & world news', region: 'eu', fallbackVideoId: 'bjgQzJzCZKs', defaultEnabled: true },
  { id: 'sky-news', name: 'Sky News', handle: 'SkyNews', channelId: 'UCoMdktPbSTixAyNGwb-UYkQ', color: 'border-cyan-500', desc: 'UK & global news', region: 'eu', fallbackVideoId: 'uvviIF4725I', defaultEnabled: true },
  { id: 'euronews', name: 'Euronews', handle: 'euronews', color: 'border-blue-400', desc: 'European & world news', region: 'eu', fallbackVideoId: 'pykpO5kQJ98' },
  { id: 'dw', name: 'DW News', handle: 'DWNews', color: 'border-indigo-300', desc: 'German international', region: 'eu', fallbackVideoId: 'LuKwFajn37U' },
  { id: 'france24', name: 'France 24', handle: 'FRANCE24', color: 'border-sky-300', desc: 'French international news', region: 'eu', fallbackVideoId: 'u9foWyMSETk' },
  { id: 'france24-en', name: 'France 24 EN', handle: 'France24_en', color: 'border-sky-400', desc: 'France 24 in English', region: 'eu', fallbackVideoId: 'Ap-UM1O9RBU' },
  { id: 'trt-world', name: 'TRT World', handle: 'TRTWorld', color: 'border-green-500', desc: 'Turkish international', region: 'eu', fallbackVideoId: 'ABfFhWzWs0s' },
  { id: 'rtve', name: 'RTVE 24H', handle: 'RTVENoticias', color: 'border-amber-400', desc: 'Spanish public news', region: 'eu', fallbackVideoId: '7_srED6k0bE' },
  // Latin America
  { id: 'cnn-brasil', name: 'CNN Brasil', handle: 'CNNbrasil', color: 'border-green-600', desc: 'Brazilian news', region: 'latam', fallbackVideoId: 'qcTn899skkc' },
  { id: 'tn-argentina', name: 'TN', handle: 'todonoticias', color: 'border-sky-600', desc: 'Argentine news', region: 'latam', fallbackVideoId: 'cb12KmMMDJA' },
  { id: 'milenio', name: 'Milenio', handle: 'MILENIO', color: 'border-red-600', desc: 'Mexican news', region: 'latam' },
  { id: 'noticias-caracol', name: 'Caracol', handle: 'NoticiasCaracol', color: 'border-yellow-600', desc: 'Colombian news', region: 'latam' },
  { id: 'ntn24', name: 'NTN24', handle: 'NTN24', color: 'border-orange-600', desc: 'Latin American news', region: 'latam' },
  // Asia
  { id: 'wion', name: 'WION', handle: 'WION', color: 'border-orange-500', desc: 'Indian global news', region: 'asia' },
  { id: 'ndtv', name: 'NDTV', handle: 'NDTV', color: 'border-amber-400', desc: 'Indian news network', region: 'asia' },
  { id: 'cna', name: 'CNA', handle: 'channelnewsasia', color: 'border-red-400', desc: 'Singapore & Asia news', region: 'asia', fallbackVideoId: 'XWq5kBlakcQ' },
  { id: 'nhk-world', name: 'NHK World', handle: 'NHKWORLDJAPAN', color: 'border-rose-500', desc: 'Japan public broadcaster', region: 'asia', fallbackVideoId: 'f0lYfG_vY_U' },
  { id: 'arirang', name: 'Arirang News', handle: 'ArirangCoKrArirangNEWS', color: 'border-blue-600', desc: 'South Korea international', region: 'asia' },
  { id: 'india-today', name: 'India Today', handle: 'indiatoday', color: 'border-orange-400', desc: 'Indian news network', region: 'asia', fallbackVideoId: 'sYZtOFzM78M' },
  { id: 'tbs-news', name: 'TBS NEWS', handle: 'tbsnewsdig', color: 'border-pink-400', desc: 'Japanese news', region: 'asia', fallbackVideoId: 'aUDm173E8k8' },
  // Middle East
  { id: 'al-jazeera', name: 'Al Jazeera', handle: 'AlJazeeraEnglish', channelId: 'UCNye-wNBqNL5ZzHSJj3l8Bg', color: 'border-amber-500', desc: 'Qatari international news', region: 'me', fallbackVideoId: 'gCNeDWCI0vo', useFallbackOnly: true, defaultEnabled: true },
  { id: 'al-arabiya', name: 'Al Arabiya', handle: 'AlArabiya', color: 'border-yellow-600', desc: 'Saudi international news', region: 'me', fallbackVideoId: 'n7eQejkXbnM', useFallbackOnly: true },
  { id: 'sky-arabia', name: 'Sky Arabia', handle: 'skynewsarabia', color: 'border-sky-600', desc: 'Sky News Arabia', region: 'me', fallbackVideoId: 'U--OjmpjF5o' },
  { id: 'trt-world-me', name: 'TRT World', handle: 'TRTWorld', color: 'border-green-600', desc: 'Turkish international', region: 'me', fallbackVideoId: 'ABfFhWzWs0s' },
  { id: 'i24-news', name: 'i24 NEWS', handle: 'i24NEWS_HE', color: 'border-blue-700', desc: 'Israeli international', region: 'me', fallbackVideoId: 'myKybZUK0IA' },
  { id: 'iran-intl', name: 'Iran Intl', handle: 'IranIntl', color: 'border-green-700', desc: 'Iran International TV', region: 'me' },
  // Africa
  { id: 'africanews', name: 'Africanews', handle: 'africanews', color: 'border-yellow-500', desc: 'Pan-African news', region: 'africa' },
  { id: 'channels-tv', name: 'Channels TV', handle: 'ChannelsTelevision', color: 'border-green-500', desc: 'Nigerian news', region: 'africa' },
  { id: 'sabc-news', name: 'SABC News', handle: 'SABCDigitalNews', color: 'border-blue-500', desc: 'South African news', region: 'africa' },
  { id: 'ktn-news', name: 'KTN News', handle: 'ktnnews_kenya', color: 'border-red-500', desc: 'Kenyan news', region: 'africa', fallbackVideoId: 'RmHtsdVb3mo' },
  { id: 'arise-news', name: 'Arise News', handle: 'AriseNewsChannel', color: 'border-amber-500', desc: 'African international', region: 'africa', fallbackVideoId: '4uHZdlX-DT4' },
  // Oceania
  { id: 'abc-au', name: 'ABC Australia', handle: 'abcnewsaustralia', color: 'border-purple-400', desc: 'Australian public news', region: 'oc', fallbackVideoId: 'vOTiJkg1voo' },
]

export const DEFAULT_ENABLED = new Set(ALL_CHANNELS.filter(ch => ch.defaultEnabled).map(ch => ch.id))
export const STORAGE_KEY = 'market-video-channels'

export const LATEST_EXTRA = [
  { id: 'real-vision', name: 'Real Vision', channelId: 'UCXgqMEMGRMcQNStdYCBgPaA', color: 'border-emerald-500', desc: 'Macro & deep dives' },
  { id: 'tasty-trades', name: 'tastylive', channelId: 'UCv1HRYS9_A9NI1xAiUnJGcA', color: 'border-orange-500', desc: 'Options & trading' },
  { id: 'wsj', name: 'Wall Street Journal', channelId: 'UCK7tptUDHh-RYDsdxO1-5QQ', color: 'border-gray-400', desc: 'Finance & business journalism' },
  { id: 'the-street', name: 'TheStreet', channelId: 'UCp6aBHRM6ZS_kLeC57HV4kg', color: 'border-teal-400', desc: 'Stocks & market analysis' },
]
