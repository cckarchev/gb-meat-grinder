/** A link that opens the app on `params`. */
export const buildShareUrl = (
  params: URLSearchParams,
  appUrl: string,
): string => {
  const url = new URL(appUrl);

  url.search = params.toString();

  return url.toString();
};
