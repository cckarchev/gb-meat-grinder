import { useEffect, useState } from 'react';
import styles from '@/components/ui/ShareButton.module.css';
import { ToggleButton } from '@/components/ui/ToggleButton';
import { TooltipBubble } from '@/components/ui/TooltipBubble';

/** How long the copy confirmation stays up. */
const NOTICE_DURATION_MS = 1500;

const COPIED_NOTICE = 'Link copied!';
const FAILED_NOTICE = 'Could not copy the link';

type ShareButtonProps = {
  /** Link copied to the clipboard on click. */
  url: string;
  className?: string;
};

/** Copies `url` to the clipboard and briefly confirms below the button. */
export const ShareButton = ({ url, className }: ShareButtonProps) => {
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (notice === null) {
      return;
    }

    const timer = window.setTimeout(() => setNotice(null), NOTICE_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [notice]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setNotice(COPIED_NOTICE);
    } catch {
      setNotice(FAILED_NOTICE);
    }
  };

  return (
    <span className={styles.shareButton}>
      <ToggleButton className={className} type="button" onClick={copyLink}>
        Share
      </ToggleButton>
      {notice ? (
        <TooltipBubble size="compact" role="status">
          {notice}
        </TooltipBubble>
      ) : null}
    </span>
  );
};
