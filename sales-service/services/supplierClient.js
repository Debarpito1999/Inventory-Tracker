/**
 * Sellers live in supplier-service / supplier_db (not in sales_db).
 */

const baseUrl = () => (process.env.SUPPLIER_SERVICE_URL || 'http://localhost:5005').replace(/\/$/, '');

async function fetchSellerById(id, authorization) {
  if (!authorization) return null;
  const res = await fetch(`${baseUrl()}/api/sellers/${id}`, {
    headers: { Authorization: authorization, Accept: 'application/json' },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Supplier service ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

module.exports = {
  fetchSellerById,
};
