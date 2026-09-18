import { ReportDetailClient } from "@/components/ReportDetailClient";

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <ReportDetailClient id={id}/>; }
