/**
 * The query string the app was opened with, read once at startup: a shared
 * state to load and the embedding page to share back to. Read here, before the
 * first render clears it from the address bar.
 */

import type { MeatGrinderState } from '@/gbMeatGrinder/reducer/reducer.types';
import { stateFromShareParams } from '@/gbMeatGrinder/share/shareState';
import { EMBED_PARAM, validEmbedBase } from '@/gbMeatGrinder/share/shareUrl';

const launchParams = new URLSearchParams(window.location.search);

/** The cckarchev page embedding the app, if any. */
export const launchEmbedBase = validEmbedBase(launchParams.get(EMBED_PARAM));

/** The state a share link opened, or `null` when it names no known model. */
export const launchSharedState = (): MeatGrinderState | null => {
  return stateFromShareParams(launchParams);
};

/** The app's own URL without a query string, the base for standalone links. */
export const appUrl = (): string => {
  return window.location.origin + window.location.pathname;
};

/** Drop the launch query string from the address bar, without a reload. */
export const clearLaunchParams = () => {
  const { pathname, hash } = window.location;

  window.history.replaceState(window.history.state, '', pathname + hash);
};
