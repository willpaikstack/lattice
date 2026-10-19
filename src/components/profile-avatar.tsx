type AvatarPreset = {
  id: string;
  label: string;
} & (
  | {
      kind: "emoji";
      value: string;
    }
  | {
      kind: "vector";
      value: "cube" | "spark" | "wave" | "bolt" | "gauge" | "part";
    }
);

type AvatarColor = {
  background: string;
  foreground: string;
  id: string;
  label: string;
};

export type AvatarState =
  | { type: "initials" }
  | { colorId: string; presetId: string; type: "preset" }
  | { file?: File; type: "upload"; url: string };

export const avatarPresets: AvatarPreset[] = [
  { id: "gear", kind: "emoji", label: "Gear", value: "⚙️" },
  { id: "lab", kind: "emoji", label: "Lab", value: "🧪" },
  { id: "rocket", kind: "emoji", label: "Rocket", value: "🚀" },
  { id: "package", kind: "emoji", label: "Package", value: "📦" },
  { id: "cube", kind: "vector", label: "Cube mark", value: "cube" },
  { id: "spark", kind: "vector", label: "Spark mark", value: "spark" },
  { id: "wave", kind: "vector", label: "Wave mark", value: "wave" },
  { id: "bolt", kind: "vector", label: "Bolt mark", value: "bolt" },
  { id: "gauge", kind: "vector", label: "Gauge mark", value: "gauge" },
  { id: "part", kind: "vector", label: "Part mark", value: "part" },
];

export const avatarColors: AvatarColor[] = [
  { background: "#f8fafc", foreground: "#334155", id: "slate", label: "Slate" },
  { background: "#ecfeff", foreground: "#155e75", id: "cyan", label: "Cyan" },
  { background: "#f0fdf4", foreground: "#166534", id: "green", label: "Green" },
  { background: "#fff7ed", foreground: "#9a3412", id: "orange", label: "Orange" },
  { background: "#fff1f2", foreground: "#be123c", id: "rose", label: "Rose" },
  { background: "#eef2ff", foreground: "#3730a3", id: "indigo", label: "Indigo" },
];

export const defaultPresetId = "cube";
export const defaultColorId = "slate";

function getPreset(id: string) {
  return avatarPresets.find((preset) => preset.id === id) ?? avatarPresets[0];
}

function getAvatarColor(id: string) {
  return avatarColors.find((color) => color.id === id) ?? avatarColors[0];
}

function VectorAvatar({ value }: { value: Extract<AvatarPreset, { kind: "vector" }>["value"] }) {
  if (value === "cube") {
    return (
      <svg aria-hidden="true" className="h-9 w-9" viewBox="0 0 48 48">
        <path d="m24 5 16 9.2v19.6L24 43 8 33.8V14.2L24 5Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="3" />
        <path d="M8.5 14.5 24 23.8l15.5-9.3M24 24v18" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
      </svg>
    );
  }

  if (value === "spark") {
    return (
      <svg aria-hidden="true" className="h-9 w-9" viewBox="0 0 48 48">
        <path d="M24 5.5 28.7 19 42.5 24 28.7 29 24 42.5 19.3 29 5.5 24 19.3 19 24 5.5Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="3" />
        <path d="M36 8v8M40 12h-8M10 34v6M13 37H7" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
      </svg>
    );
  }

  if (value === "wave") {
    return (
      <svg aria-hidden="true" className="h-9 w-9" viewBox="0 0 48 48">
        <path d="M7 19c6.7-8.2 13.3-8.2 20 0s13.3 8.2 20 0" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
        <path d="M7 29c6.7-8.2 13.3-8.2 20 0s13.3 8.2 20 0" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
      </svg>
    );
  }

  if (value === "bolt") {
    return (
      <svg aria-hidden="true" className="h-9 w-9" viewBox="0 0 48 48">
        <path d="M27 4 10 27h13l-2 17 17-23H25l2-17Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="3" />
      </svg>
    );
  }

  if (value === "gauge") {
    return (
      <svg aria-hidden="true" className="h-9 w-9" viewBox="0 0 48 48">
        <path d="M10 31a14 14 0 1 1 28 0" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
        <path d="m24 31 8-11" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
        <path d="M15 35h18" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="h-9 w-9" viewBox="0 0 48 48">
      <path d="M13 11h22l5 8-16 18L8 19l5-8Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="3" />
      <path d="M13 19h27M19 11l-3 8 8 18 8-18-3-8" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="3" />
    </svg>
  );
}

export function PresetPreview({ colorId, presetId, size = "large" }: { colorId: string; presetId: string; size?: "large" | "small" }) {
  const color = getAvatarColor(colorId);
  const preset = getPreset(presetId);
  const emojiSize = size === "large" ? "text-[38px]" : "text-[26px]";

  return (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{
        backgroundColor: color.background,
        color: color.foreground,
      }}
    >
      {preset.kind === "emoji" ? (
        <span aria-hidden="true" className={`${emojiSize} leading-none`}>
          {preset.value}
        </span>
      ) : (
        <VectorAvatar value={preset.value} />
      )}
    </div>
  );
}

export function ProfileAvatar({ avatar, initials = "WP", size = "large" }: { avatar: AvatarState; initials?: string; size?: "large" | "small" | "menu" }) {
  const sizeClass = size === "large" ? "h-24 w-24 text-[24px]" : size === "menu" ? "h-9 w-9 text-[12px]" : "h-20 w-20 text-[20px]";

  return (
    <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#2f3237] font-semibold text-white ${sizeClass}`}>
      {avatar.type === "upload" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt="Profile preview" className="h-full w-full object-cover" src={avatar.url} />
      ) : avatar.type === "preset" ? (
        <PresetPreview colorId={avatar.colorId} presetId={avatar.presetId} size={size === "menu" ? "small" : size} />
      ) : (
        initials
      )}
    </div>
  );
}
