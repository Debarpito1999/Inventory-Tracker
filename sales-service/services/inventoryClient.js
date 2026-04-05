/**
 * Products live in inventory-service / inventory_db (not in sales_db).
 */

const baseUrl = () => (process.env.INVENTORY_SERVICE_URL || 'http://localhost:5003').replace(/\/$/, '');

async function fetchProductById(id, authorization) {
  if (!authorization) return null;
  const res = await fetch(`${baseUrl()}/api/products/${id}`, {
    headers: { Authorization: authorization, Accept: 'application/json' },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Inventory service ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

async function updateProduct(id, body, authorization) {
  const res = await fetch(`${baseUrl()}/api/products/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: authorization,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Inventory service ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

module.exports = {
  fetchProductById,
  updateProduct,
};
