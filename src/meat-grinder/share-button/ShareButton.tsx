import { useEffect, useState } from "react";
import { ToggleButton } from "@/ui/toggle-button/ToggleButton";
import { TooltipBubble } from "@/ui/tooltip-bubble/TooltipBubble";
import styles from "./ShareButton.module.css";

/** How long the copy confirmation stays up. */
const NOTICE_DURATION_MS = 1500;

const COPIED_NOTICE = "Link copied!";
const FAILED_NOTICE = "Could not copy the link";

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
      {/* The status region stays mounted, so a screen reader announces the
          notice when it appears inside it. */}
      <span role="status">
        {notice ? <TooltipBubble size="compact">{notice}</TooltipBubble> : null}
      </span>
    </span>
  );
};
