"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

import { avatarColors, avatarPresets, defaultColorId, defaultPresetId, PresetPreview, ProfileAvatar as AvatarPreview, type AvatarState } from "./profile-avatar";

function revokeUpload(avatar: AvatarState) {
  if (avatar.type === "upload" && avatar.url.startsWith("blob:")) {
    URL.revokeObjectURL(avatar.url);
  }
}

export function ProfilePictureEditor({ initials = "A", initialImageUrl = "", initialPreset = null }: { initials?: string; initialImageUrl?: string; initialPreset?: { colorId: string; presetId: string } | null }) {
  const { user } = useUser();
  const router = useRouter();
  const startingAvatar: AvatarState = initialPreset ? { ...initialPreset, type: "preset" } : initialImageUrl ? { type: "upload", url: initialImageUrl } : { type: "initials" };
  const [avatar, setAvatar] = useState<AvatarState>(startingAvatar);
  const [draftAvatar, setDraftAvatar] = useState<AvatarState>(startingAvatar);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isPhotoMenuOpen, setIsPhotoMenuOpen] = useState(false);
  const [mode, setMode] = useState<"preset" | "upload">("preset");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
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
    setSaveError("");
    setDraftAvatar(avatar);
    setMode("preset");
    setIsPhotoMenuOpen(false);
    setIsEditorOpen(true);
  }

  function openUploadPicker() {
    setSaveError("");
    setDraftAvatar(avatar);
    setMode("upload");
    setIsPhotoMenuOpen(false);
    inputRef.current?.click();
  }

  function closeEditor() {
    if (saving) return;
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
    setIsEditorOpen(true);
    setSaveError("");

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setSaveError("Choose a PNG, JPG, or WebP image.");
      event.target.value = "";
      return;
    }

    if (!file.size || file.size > 5 * 1024 * 1024) {
      setSaveError("Choose a nonempty image up to 5 MB.");
      event.target.value = "";
      return;
    }

    if (draftAvatar.type === "upload" && (avatar.type !== "upload" || draftAvatar.url !== avatar.url)) {
      revokeUpload(draftAvatar);
    }

    setDraftAvatar({ file, type: "upload", url: URL.createObjectURL(file) });
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

  async function saveAvatar() {
    if (!user) {
      setSaveError("Your account is still loading. Please try again.");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      if (draftAvatar.type === "upload") {
        if (draftAvatar.file) {
          await user.setProfileImage({ file: draftAvatar.file });
          await user.updateMetadata({ unsafeMetadata: { latticeAvatarPreset: null } });
        }
      } else if (draftAvatar.type === "preset") {
        if (user.hasImage) await user.setProfileImage({ file: null });
        await user.updateMetadata({ unsafeMetadata: { latticeAvatarPreset: { colorId: draftAvatar.colorId, presetId: draftAvatar.presetId } } });
      } else {
        if (user.hasImage) await user.setProfileImage({ file: null });
        await user.updateMetadata({ unsafeMetadata: { latticeAvatarPreset: null } });
      }
      await user.reload();
    } catch {
      setSaveError("We couldn't save your profile photo. Please try again.");
      setSaving(false);
      return;
    }
    if (avatar.type === "upload" && (draftAvatar.type !== "upload" || draftAvatar.url !== avatar.url)) {
      revokeUpload(avatar);
    }

    const savedAvatar: AvatarState = draftAvatar.type === "upload"
      ? { type: "upload", url: user.imageUrl }
      : draftAvatar;
    revokeUpload(draftAvatar);
    setAvatar(savedAvatar);
    setDraftAvatar(savedAvatar);
    if (inputRef.current) inputRef.current.value = "";
    setIsEditorOpen(false);
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="rounded-md border border-[#e6e6e6] bg-white">
      <div className="border-b border-[#eeeeee] px-5 py-4">
        <h2 className="text-[19px] font-semibold tracking-tight text-[#202020]">Profile Photo</h2>
      </div>
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
        <div className="relative w-fit">
          <AvatarPreview avatar={avatar} initials={initials} />
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

            <fieldset disabled={saving} className="grid min-w-0 gap-5 border-0 p-5 md:grid-cols-[0.45fr_1fr]">
              <div className="rounded-md border border-[#e5e8ec] bg-[#f8fafc] p-4">
                <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#6f7782]">Preview</p>
                <div className="mt-4 flex justify-center">
                  <AvatarPreview avatar={draftAvatar} initials={initials} size="small" />
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
                      <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#6f7782]">Preset avatars</p><button className="mt-2 text-[13px] font-semibold text-[#3b5bdb]" onClick={() => { if (draftAvatar.type === "upload" && (avatar.type !== "upload" || draftAvatar.url !== avatar.url)) revokeUpload(draftAvatar); setDraftAvatar({ type: "initials" }); }} type="button">Use initials</button>
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
            </fieldset>

            <div className="flex flex-col-reverse gap-2 border-t border-[#e5e8ec] px-5 py-4 sm:flex-row sm:justify-end">
              <button className="rounded-md border border-[#d7d7d7] bg-white px-4 py-2 text-sm font-semibold text-[#262626]" onClick={closeEditor} type="button">
                Cancel
              </button>
              {saveError ? <p className="mr-auto text-sm font-medium text-red-700">{saveError}</p> : null}
              <button className="rounded-md bg-[#171717] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={saving} onClick={saveAvatar} type="button">
                {saving ? "Saving…" : "Save avatar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
