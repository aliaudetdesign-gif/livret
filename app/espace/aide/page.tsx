import { HelpCenter } from "@/components/HelpCenter";

export default function EspaceAidePage() {
  return (
    <div>
      <h1 className="text-[27px] font-semibold tracking-[-0.028em] mb-1">Aide</h1>
      <p className="text-sm text-ink-500 mb-8">FAQ, support et contact.</p>
      <HelpCenter />
    </div>
  );
}
