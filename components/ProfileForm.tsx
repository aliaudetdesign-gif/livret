"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updateProfile, uploadAvatar, type ProfileActionState } from "@/app/profil/actions";

const initialState: ProfileActionState = { error: null };

const inputClass =
  "w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-md focus:outline-none focus:border-[var(--color-terracotta)] transition-colors";
const labelClass = "block text-xs font-medium text-zinc-500 mb-1.5";

export function ProfileForm({
  fullName,
  email,
  phone,
  avatarUrl,
}: {
  fullName: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
}) {
  const [profileState, profileAction, profilePending] = useActionState(updateProfile, initialState);
  const [avatarState, avatarAction, avatarPending] = useActionState(uploadAvatar, initialState);

  const wasPending = useRef(false);
  const [saved, setSaved] = useState(false);

  const avatarFormRef = useRef<HTMLFormElement>(null);
  const [preview, setPreview] = useState<string | null>(avatarUrl);

  useEffect(() => {
    if (wasPending.current && !profilePending && !profileState.error) {
      setSaved(true);
      const timeout = setTimeout(() => setSaved(false), 3000);
      return () => clearTimeout(timeout);
    }
    wasPending.current = profilePending;
  }, [profilePending, profileState]);

  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  async function resizeAvatar(file: File, maxSize = 400): Promise<File> {
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
      const width = Math.round(bitmap.width * scale);
      const height = Math.round(bitmap.height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return file;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(bitmap, 0, 0, width, height);

      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png", 0.92)
      );
      if (!blob) return file;

      return new File([blob], file.name.replace(/\.\w+$/, ".png"), { type: "image/png" });
    } catch {
      return file;
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const inputEl = e.target;
    const file = inputEl.files?.[0];
    if (!file) return;

    const resized = await resizeAvatar(file);

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(resized);
    inputEl.files = dataTransfer.files;

    setPreview(URL.createObjectURL(resized));
    avatarFormRef.current?.requestSubmit();
  }

  return (
    <div className="flex flex-col gap-8">
      <form ref={avatarFormRef} action={avatarAction} className="flex items-center gap-4">
        <div className="w-[150px] h-[150px] rounded-full bg-gradient-terracotta flex items-center justify-center text-3xl font-semibold text-white overflow-hidden shrink-0">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Photo de profil" className="w-full h-full object-cover" />
          ) : (
            initials || "?"
          )}
        </div>
        <div>
          <label className="inline-block cursor-pointer text-sm font-medium text-[var(--color-terracotta)] hover:underline">
            {avatarPending ? "Envoi..." : "Changer la photo"}
            <input
              type="file"
              name="avatar"
              accept="image/*"
              className="hidden"
              disabled={avatarPending}
              onChange={handleAvatarChange}
            />
          </label>
          {avatarState.error && <p className="text-xs text-red-600 mt-1">{avatarState.error}</p>}
        </div>
      </form>

      <form action={profileAction} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="full_name" className={labelClass}>
              Nom complet
            </label>
            <input id="full_name" name="full_name" defaultValue={fullName} required className={inputClass} />
          </div>
          <div>
            <label htmlFor="phone" className={labelClass}>
              Téléphone
            </label>
            <input id="phone" name="phone" defaultValue={phone} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input
              value={email}
              disabled
              className={`${inputClass} bg-zinc-50 text-zinc-400 cursor-not-allowed`}
            />
          </div>
        </div>

        {profileState.error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{profileState.error}</p>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={profilePending}
            className="self-start bg-gradient-terracotta text-white text-sm font-medium rounded-md px-5 py-2 hover-lift disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {profilePending ? "Enregistrement..." : "Enregistrer"}
          </button>
          {saved && <span className="text-sm text-emerald-600">Enregistré.</span>}
        </div>
      </form>
    </div>
  );
}
