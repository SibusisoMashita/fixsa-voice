import type { ReactNode } from "react";
import { OpsShell } from "@/components/OpsShell";

export default function OperationsLayout({ children }: { children: ReactNode }) { return <OpsShell>{children}</OpsShell>; }
