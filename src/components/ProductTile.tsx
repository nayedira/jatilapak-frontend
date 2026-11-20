import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bookmark, Image as ImageIcon } from 'react-feather'
import type { Product } from '../lib/api/products'

const nf = new Intl.NumberFormat('id-ID')

interface Props { product: Product; variant?: 'catalog' | 'result' }

export default function ProductTile({ product, variant = 'catalog' }: Props) {
  const [saved, setSaved] = useState(false) // sementara lokal; belum ada endpoint bookmark
  const photo = product.fotos.find((f) => f.is_primary) ?? product.fotos[0]
  const price = variant === 'result' ? `Rp${nf.format(product.harga)}` : `Rp ${nf.format(product.harga)}`
  const to = `/produk/${product.product_id}`

  return (
    <article className={`tile tile-${variant}`}>
      <Link to={to} className="tile-photo" aria-label={`Lihat ${product.judul_produk}`}>
        {photo
          ? <img src={photo.url} alt="" loading="lazy" />
          : <ImageIcon size={40} color="#110E0F" aria-hidden="true" />}
      </Link>
      <div className="tile-body">
        <Link to={to} className="tile-text">
          <h3 className="tile-name">{product.judul_produk}</h3>
          <p className="tile-price">{price}</p>
        </Link>
        {variant === 'catalog' && (
          <button className="bookmark" aria-label={saved ? 'Hapus dari simpanan' : 'Simpan produk'}
            aria-pressed={saved} onClick={() => setSaved((s) => !s)}>
            <Bookmark size={22} color="#000" fill={saved ? '#000' : 'none'} />
          </button>
        )}
      </div>
    </article>
  )
}