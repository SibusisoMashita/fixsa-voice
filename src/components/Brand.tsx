import Image from "next/image";
import Link from "next/link";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="brand" href="/" aria-label="FixSA Voice home">
      <Image src="/fixsa-mark.svg" alt="" width={44} height={44} priority />
      {!compact && <span><strong>FixSA</strong> Voice<small>Speak. Track. Fix.</small></span>}
    </Link>
  );
}
