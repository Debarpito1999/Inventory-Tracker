/**
 * Calls supplier-service over HTTP (same JWT as the client). Inventory-service only uses
 * inventory_db; supplier data lives in supplier-service / supplier_db.
 */

const baseUrl = () => (process.env.SUPPLIER_SERVICE_URL || 'http://localhost:5005').replace(/\/$/, '');

/**
 * @param {string} id supplier ObjectId
 * @param {string|undefined} authorization `Bearer …` from incoming request
 * @returns {Promise<object|null>}
 */
async function fetchSupplierById(id, authorization) {
  if (!authorization) {
    return null;
  }
  const url = `${baseUrl()}/api/suppliers/${id}`;
  const res = await fetch(url, {
    headers: {
      Authorization: authorization,
      Accept: 'application/json',
    },
  });
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Supplier service ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

/**
 * @param {import('mongoose').Document[]} transactions
 * @param {string|undefined} authorization
 */
async function attachSuppliersToTransactions(transactions, authorization) {
  const plain = transactions.map((t) => (t.toObject ? t.toObject() : t));

  if (!authorization) {
    return plain.map((p) => ({
      ...p,
      supplier: p.supplierName ? { _id: p.supplier, name: p.supplierName } : p.supplier,
    }));
  }

  const ids = [
    ...new Set(plain.map((p) => p.supplier).filter(Boolean).map((id) => id.toString())),
  ];

  /** @type {Map<string, object>} */
  const map = new Map();
  await Promise.all(
    ids.map(async (id) => {
      try {
        const doc = await fetchSupplierById(id, authorization);
        if (doc) {
          map.set(id, doc);
        }
      } catch (err) {
        console.error('[supplier-client] fetch', id, err.message);
      }
    })
  );

  return plain.map((p) => {
    const key = p.supplier && p.supplier.toString();
    const fromService = key ? map.get(key) : null;
    return {
      ...p,
      supplier:
        fromService || { _id: p.supplier, name: p.supplierName || null },
    };
  });
}

module.exports = {
  fetchSupplierById,
  attachSuppliersToTransactions,
};
