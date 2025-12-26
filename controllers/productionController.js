const Production = require('../Models/Production');
const Product = require('../Models/Product');
const mongoose = require('mongoose');
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
    const { date, rawMaterials, notes } = req.body;
    let { producedProducts } = req.body;
    
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
    
    // Separate produced products: existing vs new
    const newProducedProducts = producedProducts.filter(pp => !pp.productId);
    for (const pp of newProducedProducts) {
      if (!pp.name) {
        return res.status(400).json({ message: 'New produced products require a name' });
      }
      if (pp.price === undefined || pp.price === null) {
        pp.price = 0; // ensure required price field
      }
      pp.type = pp.type || 'selling';
    }
    
    // Prepare raw materials with names
    const rawMaterialsWithNames = rawMaterials.map(rm => {
      const product = rawMaterialProducts.find(p => p._id.toString() === rm.productId.toString());
      if (!product) {
        throw new Error(`Raw material product not found for ID: ${rm.productId}`);
      }
      return {
        productId: rm.productId,
        quantity: rm.quantity,
        productName: product.name
      };
    });
    
    // Use MongoDB transaction to ensure atomicity of stock check and deduction
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Create newly produced products within the transaction
      if (newProducedProducts.length > 0) {
        const productsToCreate = newProducedProducts.map(pp => ({
          name: pp.name,
          category: pp.category,
          price: pp.price,
          stock: 0,
          type: pp.type,
          lastRestocked: new Date()
        }));
        
        const createdProducts = await Product.insertMany(productsToCreate, { session });
        
        if (createdProducts.length !== newProducedProducts.length) {
          throw new Error(`Failed to create all products. Expected ${newProducedProducts.length}, created ${createdProducts.length}`);
        }
        
        // Attach created IDs back to producedProducts array
        let createdIndex = 0;
        producedProducts = producedProducts.map(pp => {
          if (pp.productId) return pp;
          const created = createdProducts[createdIndex++];
          if (!created || !created._id) {
            throw new Error(`Failed to get created product at index ${createdIndex - 1}`);
          }
          return { ...pp, productId: created._id };
        });
      }
      
      // Fetch produced products to validate and get names (including newly created)
      const producedProductIds = producedProducts.map((pp, index) => {
        if (!pp.productId) {
          throw new Error(`Produced product at index ${index} is missing productId`);
        }
        // Normalize to ObjectId
        return pp.productId instanceof mongoose.Types.ObjectId 
          ? pp.productId 
          : new mongoose.Types.ObjectId(pp.productId);
      });
      
      const producedProductDocs = await Product.find({
        _id: { $in: producedProductIds }
      }).session(session);
      
      if (producedProductDocs.length !== producedProducts.length) {
        throw new Error('Invalid product IDs in produced products');
      }
      
      // Prepare produced products with names
      const producedProductsWithNames = producedProducts.map((pp, index) => {
        if (!pp.productId) {
          throw new Error(`Produced product at index ${index} is missing productId`);
        }
        
        // Normalize productId to string for comparison
        const productIdStr = pp.productId instanceof mongoose.Types.ObjectId 
          ? pp.productId.toString() 
          : pp.productId.toString();
        
        const product = producedProductDocs.find(p => p._id.toString() === productIdStr);
        
        if (!product) {
          throw new Error(`Product not found for ID: ${productIdStr} at index ${index}. Available IDs: ${producedProductDocs.map(p => p._id.toString()).join(', ')}`);
        }
        
        if (!product.name) {
          throw new Error(`Product found but missing name for ID: ${productIdStr}`);
        }
        
        return {
          productId: pp.productId instanceof mongoose.Types.ObjectId ? pp.productId : new mongoose.Types.ObjectId(pp.productId),
          quantity: pp.quantity,
          productName: product.name
        };
      });
      
      // Calculate ratios
      const ratios = [];
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
      
      // Atomically check and deduct raw materials from stock
      // Using findOneAndUpdate with conditions ensures atomic check-and-update
      for (const rm of rawMaterialsWithNames) {
        const product = rawMaterialProducts.find(p => p._id.toString() === rm.productId);
        if (!product) {
          throw new Error(`Raw material ${rm.productId} not found`);
        }
        
        // Atomic operation: only update if stock is sufficient
        const updatedRawProduct = await Product.findOneAndUpdate(
          { 
            _id: rm.productId, 
            stock: { $gte: rm.quantity } // Only update if stock is sufficient
          },
          { 
            $inc: { stock: -rm.quantity } 
          },
          { 
            new: true, 
            session // Include in transaction
          }
        );
        
        if (!updatedRawProduct) {
          // Get current stock for accurate error message
          const currentProduct = await Product.findById(rm.productId).session(session);
          const currentStock = currentProduct ? currentProduct.stock : 0;
          throw new Error(
            `Insufficient stock for ${product.name}. Available: ${currentStock}, Required: ${rm.quantity}`
          );
        }
      }
      
      // Add produced products to stock (within transaction)
      for (const pp of producedProductsWithNames) {
        await Product.findByIdAndUpdate(
          pp.productId,
          {
            $inc: { stock: pp.quantity },
            lastRestocked: new Date()
          },
          { session } // Include in transaction
        );
      }
      
      // Create production record (within transaction)
      const production = await Production.create([{
        date: date ? new Date(date) : new Date(),
        rawMaterials: rawMaterialsWithNames,
        producedProducts: producedProductsWithNames,
        ratios,
        notes,
        status: 'completed'
      }], { session });
      
      // Commit transaction
      await session.commitTransaction();
      
      // After successful transaction, check for low stock alerts (outside transaction)
      for (const rm of rawMaterialsWithNames) {
        const updatedProduct = await Product.findById(rm.productId);
        await checkAndAlertLowStock(updatedProduct);
      }
      
      for (const pp of producedProductsWithNames) {
        const updatedProduct = await Product.findById(pp.productId);
        await checkAndAlertLowStock(updatedProduct);
      }
      
      const populatedProduction = await Production.findById(production[0]._id)
        .populate('rawMaterials.productId')
        .populate('producedProducts.productId');
      
      res.status(201).json(populatedProduction);
    } catch (error) {
      // Rollback transaction on error
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
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

