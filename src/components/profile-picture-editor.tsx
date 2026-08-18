"use client";

import { useEffect, useRef, useState } from "react";

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

type AvatarState =
  | { type: "initials" }
  | { colorId: string; presetId: string; type: "preset" }
  | { type: "upload"; url: string };

const avatarPresets: AvatarPreset[] = [
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

const avatarColors: AvatarColor[] = [
  { background: "#f8fafc", foreground: "#334155", id: "slate", label: "Slate" },
  { background: "#ecfeff", foreground: "#155e75", id: "cyan", label: "Cyan" },
  { background: "#f0fdf4", foreground: "#166534", id: "green", label: "Green" },
  { background: "#fff7ed", foreground: "#9a3412", id: "orange", label: "Orange" },
  { background: "#fff1f2", foreground: "#be123c", id: "rose", label: "Rose" },
  { background: "#eef2ff", foreground: "#3730a3", id: "indigo", label: "Indigo" },
];

const defaultPresetId = "cube";
const defaultColorId = "slate";

function getPreset(id: string) {
  return avatarPresets.find((preset) => preset.id === id) ?? avatarPresets[0];
}

function getAvatarColor(id: string) {
  return avatarColors.find((color) => color.id === id) ?? avatarColors[0];
}

function revokeUpload(avatar: AvatarState) {
  if (avatar.type === "upload") {
    URL.revokeObjectURL(avatar.url);
  }
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

function PresetPreview({ colorId, presetId, size = "large" }: { colorId: string; presetId: string; size?: "large" | "small" }) {
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

function AvatarPreview({ avatar, initials = "WP", size = "large" }: { avatar: AvatarState; initials?: string; size?: "large" | "small" }) {
  const sizeClass = size === "large" ? "h-24 w-24 text-[24px]" : "h-20 w-20 text-[20px]";

  return (
    <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#2f3237] font-semibold text-white ${sizeClass}`}>
      {avatar.type === "upload" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt="Profile preview" className="h-full w-full object-cover" src={avatar.url} />
      ) : avatar.type === "preset" ? (
        <PresetPreview colorId={avatar.colorId} presetId={avatar.presetId} size={size} />
      ) : (
        initials
      )}
    </div>
  );
}

export function ProfilePictureEditor() {
  const [avatar, setAvatar] = useState<AvatarState>({ type: "initials" });
  const [draftAvatar, setDraftAvatar] = useState<AvatarState>({ type: "initials" });
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isPhotoMenuOpen, setIsPhotoMenuOpen] = useState(false);
  const [mode, setMode] = useState<"preset" | "upload">("preset");
  const inputRef = useRef<HTMLInputElement>(null);
  const avatarRef = useRef(avatar);
  const draftAvatarRef = useRef(draftAvatar);

  useEffect(() => {
    avatarRef.current = avatar;
  }, [avatar]);

  useEffect(() => {
    draftAvatarRef.current = draftAvatar;
  }, [draftAvatar]);

  useEffect(() => {
    return () => {
      const latestAvatar = avatarRef.current;
      const latestDraftAvatar = draftAvatarRef.current;

      revokeUpload(latestAvatar);
      if (latestDraftAvatar.type === "upload" && (latestAvatar.type !== "upload" || latestDraftAvatar.url !== latestAvatar.url)) {
        revokeUpload(latestDraftAvatar);
      }
    };
  }, []);

  function openEditor() {
    setDraftAvatar(avatar);
    setMode(avatar.type === "upload" ? "upload" : "preset");
    setIsPhotoMenuOpen(false);
    setIsEditorOpen(true);
  }

  function openUploadPicker() {
    setDraftAvatar(avatar);
    setMode("upload");
    setIsPhotoMenuOpen(false);
    inputRef.current?.click();
  }

  async function useClipboardImage() {
    setIsPhotoMenuOpen(false);

    if (!navigator.clipboard?.read) {
      return;
    }

    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        const imageType = item.types.find((type) => type.startsWith("image/"));
        if (!imageType) {
          continue;
        }

        const blob = await item.getType(imageType);
        if (draftAvatar.type === "upload" && (avatar.type !== "upload" || draftAvatar.url !== avatar.url)) {
          revokeUpload(draftAvatar);
        }
        setDraftAvatar({ type: "upload", url: URL.createObjectURL(blob) });
        setMode("upload");
        setIsEditorOpen(true);
        return;
      }
    } catch {
      return;
    }
  }

  function closeEditor() {
    if (draftAvatar.type === "upload" && (avatar.type !== "upload" || draftAvatar.url !== avatar.url)) {
      revokeUpload(draftAvatar);
    }
    setDraftAvatar(avatar);
    setIsEditorOpen(false);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      event.target.value = "";
      return;
    }

    if (draftAvatar.type === "upload" && (avatar.type !== "upload" || draftAvatar.url !== avatar.url)) {
      revokeUpload(draftAvatar);
    }

    setDraftAvatar({ type: "upload", url: URL.createObjectURL(file) });
    setMode("upload");
  }

  function selectPreset(presetId: string) {
    const previousColorId = draftAvatar.type === "preset" ? draftAvatar.colorId : defaultColorId;

    if (draftAvatar.type === "upload" && (avatar.type !== "upload" || draftAvatar.url !== avatar.url)) {
      revokeUpload(draftAvatar);
    }

    setDraftAvatar({ colorId: previousColorId, presetId, type: "preset" });
    setMode("preset");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function selectColor(colorId: string) {
    const presetId = draftAvatar.type === "preset" ? draftAvatar.presetId : defaultPresetId;

    if (draftAvatar.type === "upload" && (avatar.type !== "upload" || draftAvatar.url !== avatar.url)) {
      revokeUpload(draftAvatar);
    }

    setDraftAvatar({ colorId, presetId, type: "preset" });
    setMode("preset");
  }

  function saveAvatar() {
    if (avatar.type === "upload" && (draftAvatar.type !== "upload" || draftAvatar.url !== avatar.url)) {
      revokeUpload(avatar);
    }

    setAvatar(draftAvatar);
    setIsEditorOpen(false);
  }

  return (
    <div className="rounded-md border border-[#e6e6e6] bg-white">
      <div className="border-b border-[#eeeeee] px-5 py-4">
        <h2 className="text-[19px] font-semibold tracking-tight text-[#202020]">Profile Photo</h2>
      </div>
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
        <div className="relative w-fit">
          <AvatarPreview avatar={avatar} />
          <button
            aria-expanded={isPhotoMenuOpen}
            aria-haspopup="menu"
            className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-[#4a9ff5] text-white shadow-sm transition hover:bg-[#328de8]"
            onClick={() => setIsPhotoMenuOpen((current) => !current)}
            type="button"
          >
            <span className="sr-only">Change profile photo</span>
            <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 32 32">
              <path d="M11 10.5 13 8h6l2 2.5h3.2a2.8 2.8 0 0 1 2.8 2.8v8.9a2.8 2.8 0 0 1-2.8 2.8H7.8A2.8 2.8 0 0 1 5 22.2v-8.9a2.8 2.8 0 0 1 2.8-2.8H11Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2.2" />
              <circle cx="16" cy="18" r="4.4" fill="none" stroke="currentColor" strokeWidth="2.2" />
            </svg>
          </button>
          {isPhotoMenuOpen ? (
            <div className="absolute left-16 top-20 z-20 w-56 rounded-md border border-[#d7dce2] bg-white py-2 shadow-lg max-sm:left-0 max-sm:top-[104px]" role="menu">
              <button className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-[14px] font-semibold text-[#253040] hover:bg-[#f4f6f8]" onClick={openUploadPicker} role="menuitem" type="button">
                <span aria-hidden="true" className="text-[20px]">
                  ▧
                </span>
                File
              </button>
              <button className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-[14px] font-semibold text-[#253040] hover:bg-[#f4f6f8]" onClick={useClipboardImage} role="menuitem" type="button">
                <span aria-hidden="true" className="text-[20px]">
                  ▣
                </span>
                From clipboard
              </button>
              <button className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-[14px] font-semibold text-[#253040] hover:bg-[#f4f6f8]" onClick={openEditor} role="menuitem" type="button">
                <span aria-hidden="true" className="text-[20px]">
                  ☺
                </span>
                Use an Emoji
              </button>
            </div>
          ) : null}
          <input aria-label="Upload profile photo" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={handleFileChange} ref={inputRef} type="file" />
        </div>
      </div>

      {isEditorOpen ? (
        <div aria-labelledby="avatar-picker-title" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/45 px-4 py-6" role="dialog">
          <div className="max-h-[90vh] w-full max-w-[660px] overflow-y-auto rounded-md border border-[#d7dce2] bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#e5e8ec] px-5 py-4">
              <div>
                <h3 className="text-[18px] font-semibold tracking-tight text-[#182231]" id="avatar-picker-title">
                  Change profile photo
                </h3>
                <p className="mt-1 text-[13px] leading-5 text-[#737b86]">Choose a ready-made avatar or upload a photo.</p>
              </div>
              <button className="rounded-md px-2 py-1 text-[22px] leading-none text-[#5f6673] hover:bg-[#f3f4f6]" onClick={closeEditor} type="button">
                <span className="sr-only">Close avatar picker</span>
                ×
              </button>
            </div>

            <div className="grid gap-5 p-5 md:grid-cols-[0.45fr_1fr]">
              <div className="rounded-md border border-[#e5e8ec] bg-[#f8fafc] p-4">
                <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#6f7782]">Preview</p>
                <div className="mt-4 flex justify-center">
                  <AvatarPreview avatar={draftAvatar} size="small" />
                </div>
                <p className="mt-4 text-center text-[13px] leading-5 text-[#5f6673]">This updates your account menu and collaboration identity.</p>
              </div>

              <div>
                <div aria-label="Avatar source" className="inline-flex rounded-md border border-[#d7dce2] bg-[#f8fafc] p-1">
                  <button
                    aria-pressed={mode === "preset"}
                    className={`rounded px-3 py-1.5 text-[13px] font-semibold ${mode === "preset" ? "bg-white text-[#182231] shadow-sm" : "text-[#6f7782]"}`}
                    onClick={() => setMode("preset")}
                    type="button"
                  >
                    Presets
                  </button>
                  <button
                    aria-pressed={mode === "upload"}
                    className={`rounded px-3 py-1.5 text-[13px] font-semibold ${mode === "upload" ? "bg-white text-[#182231] shadow-sm" : "text-[#6f7782]"}`}
                    onClick={() => setMode("upload")}
                    type="button"
                  >
                    Upload
                  </button>
                </div>

                {mode === "preset" ? (
                  <div className="mt-4 space-y-5">
                    <div>
                      <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#6f7782]">Preset avatars</p>
                      <div className="mt-3 grid grid-cols-5 gap-2">
                        {avatarPresets.map((preset) => {
                          const colorId = draftAvatar.type === "preset" ? draftAvatar.colorId : defaultColorId;
                          const isSelected = draftAvatar.type === "preset" && draftAvatar.presetId === preset.id;

                          return (
                            <button
                              aria-pressed={isSelected}
                              className={`flex aspect-square items-center justify-center overflow-hidden rounded-md border transition ${
                                isSelected ? "border-[#00a889] ring-2 ring-[#00a889]/20" : "border-[#dfe3e8] hover:border-[#a9b2bf]"
                              }`}
                              key={preset.id}
                              onClick={() => selectPreset(preset.id)}
                              type="button"
                            >
                              <span className="sr-only">Use {preset.label} preset</span>
                              <PresetPreview colorId={colorId} presetId={preset.id} size="small" />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#6f7782]">Background</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {avatarColors.map((color) => {
                          const isSelected = draftAvatar.type === "preset" && draftAvatar.colorId === color.id;

                          return (
                            <button
                              aria-pressed={isSelected}
                              className={`h-9 w-9 rounded-full border transition ${isSelected ? "border-[#00a889] ring-2 ring-[#00a889]/20" : "border-[#d7dce2]"}`}
                              key={color.id}
                              onClick={() => selectColor(color.id)}
                              style={{ backgroundColor: color.background, color: color.foreground }}
                              type="button"
                            >
                              <span className="sr-only">Use {color.label} background</span>
                              <span aria-hidden="true" className="block h-3 w-3 rounded-full bg-current" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-md border border-dashed border-[#cfd5dd] bg-[#f8fafc] p-5">
                    <p className="text-[14px] font-semibold text-[#303846]">Upload your own photo</p>
                    <p className="mt-1 text-[13px] leading-5 text-[#737b86]">PNG, JPG, or WebP up to 5 MB. Square images crop best.</p>
                    <button className="mt-4 rounded-md bg-[#171717] px-4 py-2 text-sm font-semibold text-white" onClick={() => inputRef.current?.click()} type="button">
                      Choose file
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-[#e5e8ec] px-5 py-4 sm:flex-row sm:justify-end">
              <button className="rounded-md border border-[#d7d7d7] bg-white px-4 py-2 text-sm font-semibold text-[#262626]" onClick={closeEditor} type="button">
                Cancel
              </button>
              <button className="rounded-md bg-[#171717] px-4 py-2 text-sm font-semibold text-white" onClick={saveAvatar} type="button">
                Save avatar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
