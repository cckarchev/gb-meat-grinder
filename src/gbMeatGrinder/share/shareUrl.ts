/**
 * Where a share link points. The cckarchev site embeds the app in an iframe and
 * passes its own page URL as `?embed=`; links shared from inside the embed go
 * back to that page, which forwards its query params into the iframe.
 */

export const EMBED_PARAM = 'embed';

const EMBED_HOSTS = new Set(['cckarchev.ar', 'www.cckarchev.ar']);

/** cckarchev runs on plain http on these hosts in local dev. */
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1']);

/** `raw` when it is a page on the cckarchev site (or local dev), else `null`. */
export const validEmbedBase = (raw: string | null): string | null => {
  if (raw === null || !URL.canParse(raw)) {
    return null;
  }

  const url = new URL(raw);
  const isSecureCck =
    url.protocol === 'https:' && EMBED_HOSTS.has(url.hostname);
  const isLocalDev =
    url.protocol === 'http:' && LOOPBACK_HOSTS.has(url.hostname);

  return isSecureCck || isLocalDev ? raw : null;
};

/** `params` on the embedding page when there is one, else on the app itself. */
export const buildShareUrl = (
  params: URLSearchParams,
  appUrl: string,
  embedBase: string | null,
): string => {
  const url = new URL(embedBase ?? appUrl);

  url.search = params.toString();

  return url.toString();
};
