/** Small pill switch with a trailing label. */
export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button onClick={() => onChange(!on)} className="flex items-center gap-2 text-[12.5px]">
      <span className={`relative h-[18px] w-[32px] rounded-full transition-colors ${on ? 'bg-accent' : 'bg-border'}`}>
        <span
          className={`absolute top-[2px] h-[14px] w-[14px] rounded-full bg-surface transition-all ${on ? 'left-[16px]' : 'left-[2px]'}`}
        />
      </span>
      {label}
    </button>
  )
}
