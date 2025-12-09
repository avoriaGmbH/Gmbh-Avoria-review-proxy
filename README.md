# Judge.me Review Proxy

A secure API proxy for fetching Judge.me reviews with automatic Shopify product ID conversion and pagination support.

## Features

- ✅ Automatic conversion from Shopify product ID to Judge.me internal ID
- ✅ Smart pagination with first, prev, next, and last page links
- ✅ CORS enabled for frontend usage
- ✅ Accurate review counts per product
- ✅ Configurable results per page

## Installation

```bash
npm install
```

## Local Development

```bash
npm start
```

Server runs on `http://localhost:3000`

## API Endpoint

### GET `/api/judgeme`

Fetch Judge.me reviews for a product.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `product_external_id` | string | No* | Shopify product ID (auto-converts to Judge.me ID) |
| `product_id` | string | No* | Judge.me internal product ID |
| `per_page` | number | No | Results per page (default: 10) |
| `page` | number | No | Page number (default: 1) |
| `rating` | number | No | Filter by rating (1-5) |
| `published` | boolean | No | Filter published reviews |

*Either `product_external_id` or `product_id` recommended for product-specific reviews

#### Example Requests

```bash
# Get reviews for a product using Shopify ID
GET /api/judgeme?product_external_id=15440592437583

# With pagination
GET /api/judgeme?product_external_id=15440592437583&per_page=20&page=2

# Filter by rating
GET /api/judgeme?product_external_id=15440592437583&rating=5
```

#### Response Format

```json
{
  "reviews": [...],
  "pagination": {
    "current_page": 1,
    "per_page": 10,
    "total": 45,
    "first": "https://your-domain.com/api/judgeme?page=1",
    "prev": null,
    "next": "https://your-domain.com/api/judgeme?page=2",
    "last": "https://your-domain.com/api/judgeme?page=5"
  }
}
```

## Deployment

### Render

1. Push code to GitHub
2. Create new Web Service on Render
3. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node

## Configuration

Default credentials are hardcoded in `server.js`:
- Shop domain: `avoria-liquids-shop.myshopify.com`
- API token: `NEPVyiXra7OSexIs3O_2ogOhhp8`

To use different credentials, pass them as query parameters:
```
?shop_domain=your-shop.myshopify.com&api_token=your-token
```

## License

MIT
