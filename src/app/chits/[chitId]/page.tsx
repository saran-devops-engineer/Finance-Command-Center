import { Suspense } from "react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { ChitDetailScreen } from "@/features/chits/chit-detail-screen";

interface ChitDetailPageProps {
  params: Promise<{ chitId: string }>;
}

export default async function ChitDetailPage({ params }: ChitDetailPageProps) {
  const { chitId } = await params;

  return (
    <MobileShell>
      <Suspense fallback={null}>
        <ChitDetailScreen chitId={chitId} />
      </Suspense>
    </MobileShell>
  );
}
