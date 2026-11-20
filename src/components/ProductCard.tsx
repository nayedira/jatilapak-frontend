import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bookmark, MapPin } from 'react-feather'
import type { Product } from '../lib/api/products'

const rupiah = (n: number) => 'Rp ' + new Intl.NumberFormat('id-ID').format(n)

export default function ProductCard({ product }: { product: Product }) {
  const [saved, setSaved] = useState(false)
  const photo = product.fotos.find((f) => f.is_primary) ?? product.fotos[0]
  const to = `/produk/${product.product_id}`

  return (
    <article className="product-card">
      <Link to={to} aria-label={`Lihat ${product.judul_produk}`} style={{ display: 'block' }}>
        {photo
          ? <img className="product-photo" src={photo.url} alt="" loading="lazy" />
          : <div className="product-photo" aria-hidden="true" />}
      </Link>
      <div className="product-body">
        <Link to={to} className="plain-link">
          <h3 className="product-name">{product.judul_produk}</h3>
          <p className="product-price">{rupiah(product.harga)}</p>
          {product.lokasi && (
            <div className="product-loc"><MapPin size={12} color="#000" />{product.lokasi}</div>
          )}
        </Link>
        <button className="bookmark" aria-label={saved ? 'Hapus dari simpanan' : 'Simpan produk'}
          aria-pressed={saved} onClick={() => setSaved((s) => !s)}>
          <Bookmark size={22} color="#000" fill={saved ? '#000' : 'none'} />
        </button>
      </div>
    </article>
  )
}