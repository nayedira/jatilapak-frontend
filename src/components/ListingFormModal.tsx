import { useEffect, useRef, useState } from 'react'
import { Image as ImageIcon, Upload, X } from 'react-feather'
import { CATEGORIES, type Condition, type Product } from '../lib/api/products'
import {
  createProduct, setProductStatus, updateProduct, uploadImage, validateImage, type ProductInput,
} from '../lib/api/profile'
import { ApiError } from '../lib/api/client'
import { uuid } from '../lib/uuid'
import Button from './Button'

interface Photo { key: string; url: string }
const MAX_PHOTOS = 5

interface Props {
  open: boolean
  product: Product | null // null = buat baru
  onClose: () => void
  onSaved: (message: string) => void
}

export default function ListingFormModal({ open, product, onClose, onSaved }: Props) {
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [category, setCategory] = useState('')
  const [price, setPrice] = useState('')
  const [condition, setCondition] = useState<Condition>('Used')
  const [status, setStatus] = useState<'Available' | 'Sold'>('Available')
  const [photos, setPhotos] = useState<Photo[]>([])
  const [uploading, setUploading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const editing = !!product

  useEffect(() => {
    if (!open) return
    setTitle(product?.judul_produk ?? '')
    setDesc(product?.deskripsi_produk ?? '')
    setCategory(product?.kategori ?? '')
    setPrice(product ? String(product.harga) : '')
    setCondition(product?.kondisi_barang ?? 'Used')
    setStatus(product?.status_stok ?? 'Available')
    setPhotos((product?.fotos ?? []).slice().sort((a, b) => a.urutan - b.urutan).map((f) => ({ key: f.foto_id, url: f.url })))
    setError('')
  }, [open, product])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, busy, onClose])

  async function onFiles(files: FileList | null) {
    if (!files || !files.length) return
    setError('')
    const room = MAX_PHOTOS - photos.length
    if (files.length > room) setError(`Maksimal ${MAX_PHOTOS} foto.`)
    setUploading(true)
    try {
      for (const f of Array.from(files).slice(0, room)) {
        const bad = validateImage(f)
        if (bad) { setError(bad); continue }
        const up = await uploadImage(f, 'product')
        setPhotos((p) => [...p, { key: up.public_id || uuid(), url: up.url }])
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Gagal mengunggah foto.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function submit() {
    const t = title.trim()
    const d = desc.trim()
    const p = Number(price)
    if (!t) return setError('Nama produk wajib diisi.')
    if (!d) return setError('Deskripsi wajib diisi.')
    if (!category) return setError('Pilih kategori.')
    if (price === '' || Number.isNaN(p) || p < 0) return setError('Harga tidak valid.')

    setBusy(true)
    setError('')
    const body: ProductInput = {
      judul_produk: t, deskripsi_produk: d, kategori: category, harga: p, kondisi_barang: condition,
      fotos: photos.map((x, i) => ({ url: x.url, urutan: i + 1, is_primary: i === 0 })),
    }
    try {
      if (product) {
        await updateProduct(product.product_id, body)
        if (status !== (product.status_stok ?? 'Available')) await setProductStatus(product.product_id, status)
        onSaved('Listing berhasil diperbarui.')
      } else {
        await createProduct(body)
        onSaved('Listing berhasil diterbitkan.')
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Gagal menyimpan listing. Coba lagi.')
    } finally {
      setBusy(false)
    }
  }

  if (!open) return null
  return (
    <div className="layer">
      <div className="layer-overlay" onClick={busy ? undefined : onClose} />
      <section className="modal form" role="dialog" aria-modal="true" aria-label={editing ? 'Edit listing' : 'Buat lapak baru'}>
        <div className="modal-head">
          <div>
            <h2 className="modal-title small-title">{editing ? 'Edit Listing' : 'Buat Lapak Baru'}</h2>
            <p className="modal-sub">{editing ? 'Ubah informasi listing' : 'Isi informasi produk atau jasa'}</p>
          </div>
          <button className="close-sq" aria-label="Tutup" onClick={onClose} disabled={busy}><X size={18} color="#110E0F" /></button>
        </div>

        <div className="photo-grid">
          {photos.map((ph, i) => (
            <div className="photo-tile" key={ph.key}>
              <img src={ph.url} alt={`Foto ${i + 1}`} />
              <button className="photo-x" aria-label={`Hapus foto ${i + 1}`} onClick={() => setPhotos((p) => p.filter((x) => x.key !== ph.key))}>
                <X size={14} color="#110E0F" strokeWidth={3} />
              </button>
              {i === 0 && <span className="photo-main">Utama</span>}
            </div>
          ))}
          {photos.length === 0 && <div className="photo-tile"><ImageIcon size={24} color="#110E0F" /></div>}
          {photos.length < MAX_PHOTOS && (
            <button className="photo-add" onClick={() => fileRef.current?.click()} disabled={uploading}>
              <Upload size={20} color="#110E0F" />
              <span>{uploading ? 'Mengunggah…' : 'Tambah gambar'}</span>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden
            onChange={(e) => onFiles(e.target.files)} />
        </div>

        <input className="lf-input" placeholder="Nama Produk" aria-label="Nama produk" maxLength={150}
          value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className="lf-input area" placeholder="Deskripsi" aria-label="Deskripsi"
          value={desc} onChange={(e) => setDesc(e.target.value)} />
        <div className="lf-row">
          <select className="lf-input" aria-label="Kategori" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Kategori</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input className="lf-input" placeholder="Harga" aria-label="Harga (Rp)" inputMode="numeric"
            value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ''))} />
        </div>

        <div className="lf-line">
          <span className="lf-label">Kondisi Barang</span>
          <div className="seg" role="radiogroup" aria-label="Kondisi barang">
            <button role="radio" aria-checked={condition === 'Used'} className={condition === 'Used' ? 'on' : ''} onClick={() => setCondition('Used')}>Bekas</button>
            <button role="radio" aria-checked={condition === 'New'} className={condition === 'New' ? 'on' : ''} onClick={() => setCondition('New')}>Baru</button>
          </div>
        </div>

        {editing && (
          <div className="lf-line">
            <span className="lf-label">Status Ketersediaan</span>
            <select className="status-select" aria-label="Status ketersediaan" value={status}
              onChange={(e) => setStatus(e.target.value as 'Available' | 'Sold')}>
              <option value="Available">Tersedia</option>
              <option value="Sold">Terjual</option>
            </select>
          </div>
        )}

        {error && <p className="field-error" role="alert">{error}</p>}

        <div className="modal-actions">
          <Button variant="outline" type="button" onClick={onClose} disabled={busy}>Batalkan</Button>
          <Button type="button" loading={busy} disabled={uploading} onClick={submit}>
            {editing ? 'Simpan Perubahan' : 'Terbitkan Produk'}
          </Button>
        </div>
      </section>
    </div>
  )
}