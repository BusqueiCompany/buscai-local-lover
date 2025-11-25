# Firestore Schema Recomendada

## users/{uid}
- nome: string
- email: string
- telefone: string
- nivel: string (ADMIN, SUPORTE, PARCEIRO, FREE, VIP, ENTREGADOR)
- ativo: boolean
- profileImg: string (url)
- lastOnline: timestamp
- location: { lat: number, lng: number }
- entregadorStatus: string (offline|online|busy)

## produtos_base/{barcode}
- sku: string
- barcode: string
- name: string
- brand: string
- category: string
- unit: string
- quantity: number
- image_url: string
- source: string
- to_review: boolean
- last_synced: timestamp

## comercios/{storeId}
- nome, endereco, lat, lng, parceiroId, horario
- Subcollection: comercios/{storeId}/produtos/{sku}
  - ref_produto_base (barcode)
  - price: number
  - stock: number
  - last_update: timestamp

## pedidos/{orderId}
- storeId, clienteId, entregadorId
- itens: [{ sku, name, qty, price }]
- total: number
- status: string (NEW|ASSIGNED|ACCEPTED|CHEGANDO_LOJA|NA_FILA|RETIRADO|EM_ROTA|ENTREGUE|CANCELADO)
- timestamps: createdAt, acceptedAt, pickedAt, deliveredAt
- history: array objects {status, by, at, note}
- chat (subcollection): pedidos/{orderId}/chat/{messageId}

## entregadores/{uid}
- uid, location {lat,lng}, status, currentOrderId, rating, vehicleType

