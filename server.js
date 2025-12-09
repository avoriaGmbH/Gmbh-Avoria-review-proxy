import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Judge.me Proxy API is running' });
});

app.get('/api/judgeme', async (req, res) => {
  try {
    const { 
      shop_domain = process.env.JUDGEME_SHOP_DOMAIN, 
      api_token = process.env.JUDGEME_API_TOKEN,
      product_external_id,
      ...params 
    } = req.query;

    if (!shop_domain || !api_token) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    let productId = params.product_id;

    if (product_external_id && !productId) {
      const productUrl = `https://judge.me/api/v1/products/-1?shop_domain=${shop_domain}&api_token=${api_token}&external_id=${product_external_id}`;
      const productResponse = await fetch(productUrl);
      const productData = await productResponse.json();
      
      if (productData.product?.id) {
        productId = productData.product.id;
      }
    }

    const reviewParams = { ...params };
    if (productId) {
      reviewParams.product_id = productId;
    }

    const currentPage = parseInt(reviewParams.page || '1');
    const perPage = parseInt(reviewParams.per_page || '10');

    const countParams = new URLSearchParams({ shop_domain, api_token });
    if (productId) countParams.set('product_id', productId);
    const countUrl = `https://judge.me/api/v1/reviews/count?${countParams.toString()}`;
    const countResponse = await fetch(countUrl);
    const countData = await countResponse.json();
    const totalReviews = countData.count || 0;

    const queryString = new URLSearchParams(reviewParams).toString();
    const judgeUrl = `https://judge.me/api/v1/reviews?shop_domain=${shop_domain}&api_token=${api_token}&${queryString}`;
    const response = await fetch(judgeUrl);
    const data = await response.json();

    const baseUrl = `${req.protocol}://${req.get('host')}/api/judgeme`;
    const buildUrl = (page) => {
      const urlParams = new URLSearchParams({ ...reviewParams, page: page.toString() });
      if (product_external_id) urlParams.set('product_external_id', product_external_id);
      return `${baseUrl}?${urlParams.toString()}`;
    };

    const lastPage = Math.ceil(totalReviews / perPage);

    const pagination = {
      current_page: currentPage,
      per_page: perPage,
      total_reviews: totalReviews,
      total_pages: lastPage,
      current_page_count: data.reviews?.length || 0,
      first: buildUrl(1),
      prev: currentPage > 1 ? buildUrl(currentPage - 1) : null,
      next: currentPage < lastPage ? buildUrl(currentPage + 1) : null,
      last: buildUrl(lastPage)
    };

    let averageRating = null;

    // Calculate average rating if product is specified
    if (productId && totalReviews > 0) {
      const allReviewsUrl = `https://judge.me/api/v1/reviews?shop_domain=${shop_domain}&api_token=${api_token}&product_id=${productId}&per_page=${totalReviews}`;
      const allReviewsResponse = await fetch(allReviewsUrl);
      const allReviewsData = await allReviewsResponse.json();
      
      if (allReviewsData.reviews && allReviewsData.reviews.length > 0) {
        const totalRating = allReviewsData.reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
        averageRating = (totalRating / allReviewsData.reviews.length).toFixed(2);
      }
    }

    res.status(200).json({ 
      ...data, 
      pagination,
      average_rating: averageRating ? parseFloat(averageRating) : null
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
