import { Checklist } from "@/components/Checklist";
import { Gate } from "@/components/Gate";
import { dataset } from "@/lib/dataset";
import { isGated } from "@/lib/gate";

export const dynamic = "force-dynamic";

export default async function Home() {
  const gated = await isGated();
  return (
    <main className="page">
      <h1>Community Center Checklist</h1>
      <p className="subtitle">Stardew Valley {dataset.game} · default bundles</p>
      {gated ? <Checklist rooms={dataset.rooms} /> : <Gate />}
    </main>
  );
}
