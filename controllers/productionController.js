const Production = require('../Models/Production');
const Product = require('../Models/Product');
const { checkAndAlertLowStock } = require('../utils/lowStockChecker');

// Get all productions
const getAll = async (req, res) => {
  try {
    const productions = await Production.find()
      .populate('rawMaterials.productId')
      .populate('producedProducts.productId')
      .sort({ date: -1, createdAt: -1 });
    res.json(productions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get productions by date range
const getByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    const productions = await Production.find(query)
      .populate('rawMaterials.productId')
      .populate('producedProducts.productId')
      .sort({ date: -1, createdAt: -1 });
    res.json(productions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get productions for a specific date
const getByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const productions = await Production.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    })
      .populate('rawMaterials.productId')
      .populate('producedProducts.productId')
      .sort({ createdAt: -1 });
    res.json(productions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new production
const create = async (req, res) => {
  try {
    const { date, rawMaterials, producedProducts, notes } = req.body;
    
    // Validate input
    if (!rawMaterials || !Array.isArray(rawMaterials) || rawMaterials.length === 0) {
      return res.status(400).json({ message: 'At least one raw material is required' });
    }
    
    if (!producedProducts || !Array.isArray(producedProducts) || producedProducts.length === 0) {
      return res.status(400).json({ message: 'At least one produced product is required' });
    }
    
    // Fetch raw material products to validate and get names
    const rawMaterialProducts = await Product.find({
      _id: { $in: rawMaterials.map(rm => rm.productId) },
      type: 'raw'
    });
    
    if (rawMaterialProducts.length !== rawMaterials.length) {
      return res.status(400).json({ message: 'All raw materials must be of type "raw"' });
    }
    
    // Fetch produced products to validate and get names
    const producedProductDocs = await Product.find({
      _id: { $in: producedProducts.map(pp => pp.productId) }
    });
    
    if (producedProductDocs.length !== producedProducts.length) {
      return res.status(400).json({ message: 'Invalid product IDs in produced products' });
    }
    
    // Check if raw materials have sufficient stock
    for (const rm of rawMaterials) {
      const product = rawMaterialProducts.find(p => p._id.toString() === rm.productId);
      if (!product) {
        return res.status(400).json({ message: `Raw material ${rm.productId} not found` });
      }
      if (product.stock < rm.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Required: ${rm.quantity}` 
        });
      }
    }
    
    // Prepare raw materials with names
    const rawMaterialsWithNames = rawMaterials.map(rm => {
      const product = rawMaterialProducts.find(p => p._id.toString() === rm.productId);
      return {
        productId: rm.productId,
        quantity: rm.quantity,
        productName: product.name
      };
    });
    
    // Prepare produced products with names
    const producedProductsWithNames = producedProducts.map(pp => {
      const product = producedProductDocs.find(p => p._id.toString() === pp.productId);
      return {
        productId: pp.productId,
        quantity: pp.quantity,
        productName: product.name
      };
    });
    
    // Calculate ratios
    const ratios = [];
    const totalRawQuantity = rawMaterialsWithNames.reduce((sum, rm) => sum + rm.quantity, 0);
    const totalProducedQuantity = producedProductsWithNames.reduce((sum, pp) => sum + pp.quantity, 0);
    
    // Calculate ratio for each raw material to each produced product
    // Ratio shows: how much product is produced per unit of this specific raw material
    for (const rm of rawMaterialsWithNames) {
      for (const pp of producedProductsWithNames) {
        // Direct ratio: product quantity per unit of this raw material
        // Example: If 10 units of raw material produces 5 units of product, ratio = 0.5
        const directRatio = rm.quantity > 0 ? pp.quantity / rm.quantity : 0;
        
        ratios.push({
          rawMaterialId: rm.productId,
          rawMaterialName: rm.productName,
          productId: pp.productId,
          productName: pp.productName,
          ratio: directRatio
        });
      }
    }
    
    // Deduct raw materials from stock
    for (const rm of rawMaterialsWithNames) {
      await Product.findByIdAndUpdate(rm.productId, {
        $inc: { stock: -rm.quantity }
      });
      
      // Check for low stock after deduction
      const updatedProduct = await Product.findById(rm.productId);
      await checkAndAlertLowStock(updatedProduct);
    }
    
    // Add produced products to stock
    for (const pp of producedProductsWithNames) {
      await Product.findByIdAndUpdate(pp.productId, {
        $inc: { stock: pp.quantity },
        lastRestocked: new Date()
      });
      
      // Check for low stock (though unlikely after adding stock)
      const updatedProduct = await Product.findById(pp.productId);
      await checkAndAlertLowStock(updatedProduct);
    }
    
    // Create production record
    const production = await Production.create({
      date: date ? new Date(date) : new Date(),
      rawMaterials: rawMaterialsWithNames,
      producedProducts: producedProductsWithNames,
      ratios,
      notes,
      status: 'completed'
    });
    
    const populatedProduction = await Production.findById(production._id)
      .populate('rawMaterials.productId')
      .populate('producedProducts.productId');
    
    res.status(201).json(populatedProduction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get production statistics
const getStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    const productions = await Production.find(query);
    
    const stats = {
      totalProductions: productions.length,
      totalRawMaterialsUsed: 0,
      totalProductsProduced: 0,
      rawMaterialsBreakdown: {},
      productsBreakdown: {},
      averageRatios: {}
    };
    
    productions.forEach(prod => {
      prod.rawMaterials.forEach(rm => {
        stats.totalRawMaterialsUsed += rm.quantity;
        stats.rawMaterialsBreakdown[rm.productName] = 
          (stats.rawMaterialsBreakdown[rm.productName] || 0) + rm.quantity;
      });
      
      prod.producedProducts.forEach(pp => {
        stats.totalProductsProduced += pp.quantity;
        stats.productsBreakdown[pp.productName] = 
          (stats.productsBreakdown[pp.productName] || 0) + pp.quantity;
      });
    });
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAll,
  getByDateRange,
  getByDate,
  create,
  getStats
};

