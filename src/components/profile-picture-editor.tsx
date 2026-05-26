"use client";

import { useEffect, useRef, useState } from "react";

export function ProfilePictureEditor() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(URL.createObjectURL(file));
  }

  function removePhoto() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <div className="rounded-md border border-[#e6e6e6] bg-white">
      <div className="border-b border-[#eeeeee] px-5 py-4">
        <h2 className="text-[19px] font-semibold tracking-tight text-[#202020]">Profile Photo</h2>
        <p className="mt-1 text-[14px] leading-5 text-[#707782]">Shown in your account menu and internal collaboration views.</p>
      </div>
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#2f3237] text-[24px] font-semibold text-white">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="Profile preview" className="h-full w-full object-cover" src={previewUrl} />
          ) : (
            "WP"
          )}
        </div>
        <div className="min-w-0 flex-1">
          <input accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={handleFileChange} ref={inputRef} type="file" />
          <div className="flex flex-wrap gap-2">
            <button className="rounded-md bg-[#171717] px-4 py-2 text-sm font-semibold text-white" onClick={() => inputRef.current?.click()} type="button">
              {previewUrl ? "Change Photo" : "Upload Photo"}
            </button>
            <button
              className="rounded-md border border-[#d7d7d7] bg-white px-4 py-2 text-sm font-semibold text-[#262626] disabled:cursor-not-allowed disabled:opacity-45"
              disabled={!previewUrl}
              onClick={removePhoto}
              type="button"
            >
              Remove
            </button>
          </div>
          <p className="mt-3 text-[13px] leading-5 text-[#707782]">PNG, JPG, or WebP. Use a square image for the cleanest crop.</p>
        </div>
      </div>
    </div>
  );
}
