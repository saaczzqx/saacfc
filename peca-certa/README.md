# PeçaCerta

Comparador de preços de peças de PC em tempo real para o Brasil.

Consulta **KaBuM!**, **Terabyte** e **Zoom**, mostra **PIX**, **cartão**, **parcelamento** e **cupons** quando a loja publica o código, e deixa montar uma lista de peças com o total estimado.

## Desenvolvimento

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## API

`GET /api/search?q=ryzen+5+5600&payment=pix`

- `payment`: `pix` | `card` | `installments` | `coupon`
- `stores` (opcional): `kabum,terabyte,zoom`

## Observações

Os preços vêm das vitrines públicas das lojas e podem mudar a qualquer momento. Sempre confirme valor, frete e cupom no checkout.
