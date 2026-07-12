import { MobileShell } from "@/components/layout/mobile-shell";
import { EditChitScreen } from "@/features/chits/edit-chit-screen";

interface EditChitPageProps {
  params: Promise<{ chitId: string }>;
}

export default async function EditChitPage({ params }: EditChitPageProps) {
  const { chitId } = await params;

  return (
    <MobileShell>
      <EditChitScreen chitId={chitId} />
    </MobileShell>
  );
}
