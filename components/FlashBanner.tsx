import type { FlashMessage } from "@/lib/flash";
import ui from "@/styles/ui.module.css";

export default function FlashBanner({
  flash,
}: {
  flash: FlashMessage | null;
}) {
  if (!flash) {
    return null;
  }

  const className =
    flash.kind === "error"
      ? ui.error
      : flash.kind === "warning"
        ? ui.warning
        : ui.notice;

  return (
    <p className={className} role="status">
      {flash.message}
    </p>
  );
}
