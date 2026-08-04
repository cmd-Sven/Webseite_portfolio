import { useEffect, useRef, useState } from 'react'
import { FileText, ImageIcon, Loader2, PenLine, Trash2, Upload } from 'lucide-react'
import {
  getMasterProfileAssetUrl,
  removeMasterProfileAsset,
  uploadMasterProfileAsset,
} from '../../lib/atsApi'
import type { MasterProfileAssetKind, MasterProfileAssets } from '../../types/ats'

type Props = {
  userId: string
  assets: MasterProfileAssets
  onChange: (assets: MasterProfileAssets) => void
  onError: (message: string) => void
}

const ZONES: {
  kind: MasterProfileAssetKind
  title: string
  hint: string
  accept: string
  icon: typeof FileText
}[] = [
  {
    kind: 'cv_pdf',
    title: 'Master-Lebenslauf (PDF)',
    hint: 'PDF, max. ca. 10 MB',
    accept: 'application/pdf',
    icon: FileText,
  },
  {
    kind: 'photo',
    title: 'Profilbild',
    hint: 'JPG, PNG oder WebP — optional',
    accept: 'image/jpeg,image/png,image/webp,image/gif',
    icon: ImageIcon,
  },
  {
    kind: 'signature',
    title: 'Digitale Unterschrift',
    hint: 'Transparentes PNG empfohlen — optional',
    accept: 'image/jpeg,image/png,image/webp,image/gif',
    icon: PenLine,
  },
]

function AssetZone({
  userId,
  kind,
  title,
  hint,
  accept,
  Icon,
  path,
  onUploaded,
  onCleared,
  onError,
}: {
  userId: string
  kind: MasterProfileAssetKind
  title: string
  hint: string
  accept: string
  Icon: typeof FileText
  path: string | null | undefined
  onUploaded: (path: string) => void
  onCleared: () => void
  onError: (message: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setPreviewUrl(null)
    if (!path) return

    void getMasterProfileAssetUrl(path).then(({ url, error }) => {
      if (cancelled) return
      if (error) {
        onError(error)
        return
      }
      setPreviewUrl(url)
    })

    return () => {
      cancelled = true
    }
  }, [path, onError])

  async function handleFile(file: File | undefined) {
    if (!file) return
    setUploading(true)
    const { path: nextPath, error } = await uploadMasterProfileAsset(userId, kind, file)
    setUploading(false)
    if (error || !nextPath) {
      onError(error || 'Upload fehlgeschlagen')
      return
    }
    onUploaded(nextPath)
  }

  async function handleRemove() {
    if (!path) return
    setUploading(true)
    const { error } = await removeMasterProfileAsset(path)
    setUploading(false)
    if (error) {
      onError(error)
      return
    }
    onCleared()
    setPreviewUrl(null)
  }

  return (
    <div className="rounded-md border border-dashed border-zinc-200 bg-zinc-50/60 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="rounded-md bg-white border border-zinc-200 p-2 text-zinc-500">
          <Icon className="w-4 h-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-zinc-900">{title}</p>
          <p className="text-xs text-zinc-500">{hint}</p>
          {path && (
            <p className="text-[11px] text-zinc-400 mt-1 truncate" title={path}>
              {path}
            </p>
          )}
        </div>
      </div>

      {kind !== 'cv_pdf' && previewUrl && (
        <img
          src={previewUrl}
          alt={title}
          className={`max-h-24 rounded border border-zinc-200 bg-white object-contain ${
            kind === 'signature' ? 'bg-[repeating-conic-gradient(#f4f4f5_0%_25%,#fff_0%_50%)_0_0/12px_12px]' : ''
          }`}
        />
      )}

      {kind === 'cv_pdf' && previewUrl && (
        <a
          href={previewUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex text-xs text-zinc-700 underline underline-offset-2 hover:text-zinc-900"
        >
          PDF öffnen
        </a>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
          ) : (
            <Upload className="w-3.5 h-3.5" aria-hidden />
          )}
          {path ? 'Ersetzen' : 'Hochladen'}
        </button>
        {path && (
          <button
            type="button"
            disabled={uploading}
            onClick={() => void handleRemove()}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden />
            Entfernen
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            void handleFile(file)
          }}
        />
      </div>
    </div>
  )
}

export function MasterProfileAssetUpload({ userId, assets, onChange, onError }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-zinc-900">Dokumente & Medien</h3>
        <p className="text-xs text-zinc-500 mt-0.5">
          Private Uploads in Supabase Storage (Bucket <code className="text-[11px]">master-profile</code>
          ).
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {ZONES.map((z) => (
          <AssetZone
            key={z.kind}
            userId={userId}
            kind={z.kind}
            title={z.title}
            hint={z.hint}
            accept={z.accept}
            Icon={z.icon}
            path={assets[z.kind]}
            onUploaded={(path) => onChange({ ...assets, [z.kind]: path })}
            onCleared={() => onChange({ ...assets, [z.kind]: null })}
            onError={onError}
          />
        ))}
      </div>
    </div>
  )
}
