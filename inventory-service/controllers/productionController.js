const Production = require('../models/Production');
const Product = require('../models/Product');
const mongoose = require('mongoose');
const { checkAndAlertLowStock } = require('../utils/lowStockChecker');

const getAll = async (req, res) => {
  try {
    const productions = await Production.find({ user: req.user._id })
      .populate('rawMaterials.productId')
      .populate('producedProducts.productId')
      .sort({ date: -1, createdAt: -1 });
    res.json(productions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { user: req.user._id };

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

const getByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const productions = await Production.find({
      user: req.user._id,
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

const create = async (req, res) => {
  try {
    const { date, rawMaterials, notes } = req.body;
    let { producedProducts } = req.body;

    if (!rawMaterials || !Array.isArray(rawMaterials) || rawMaterials.length === 0) {
      return res.status(400).json({ message: 'At least one raw material is required' });
    }

    if (!producedProducts || !Array.isArray(producedProducts) || producedProducts.length === 0) {
      return res.status(400).json({ message: 'At least one produced product is required' });
    }

    const rawMaterialProducts = await Product.find({
      _id: { $in: rawMaterials.map(rm => rm.productId) },
      user: req.user._id,
      type: 'raw'
    });

    if (rawMaterialProducts.length !== rawMaterials.length) {
      return res.status(400).json({ message: 'All raw materials must be of type "raw"' });
    }

    const newProducedProducts = producedProducts.filter(pp => !pp.productId);
    for (const pp of newProducedProducts) {
      if (!pp.name) {
        return res.status(400).json({ message: 'New produced products require a name' });
      }
      if (pp.price === undefined || pp.price === null) {
        pp.price = 0;
      }
      pp.type = pp.type || 'selling';
    }

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

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      if (newProducedProducts.length > 0) {
        const productsToCreate = newProducedProducts.map(pp => ({
          user: req.user._id,
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

      const producedProductIds = producedProducts.map((pp, index) => {
        if (!pp.productId) {
          throw new Error(`Produced product at index ${index} is missing productId`);
        }
        return pp.productId instanceof mongoose.Types.ObjectId
          ? pp.productId
          : new mongoose.Types.ObjectId(pp.productId);
      });

      const producedProductDocs = await Product.find({
        _id: { $in: producedProductIds },
        user: req.user._id
      }).session(session);

      if (producedProductDocs.length !== producedProducts.length) {
        throw new Error('Invalid product IDs in produced products');
      }

      const producedProductsWithNames = producedProducts.map((pp, index) => {
        if (!pp.productId) {
          throw new Error(`Produced product at index ${index} is missing productId`);
        }

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

      const ratios = [];
      for (const rm of rawMaterialsWithNames) {
        for (const pp of producedProductsWithNames) {
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

      for (const rm of rawMaterialsWithNames) {
        const product = rawMaterialProducts.find(p => p._id.toString() === rm.productId.toString());
        if (!product) {
          throw new Error(`Raw material ${rm.productId} not found`);
        }

        const updatedRawProduct = await Product.findOneAndUpdate(
          {
            _id: rm.productId,
            user: req.user._id,
            stock: { $gte: rm.quantity }
          },
          {
            $inc: { stock: -rm.quantity }
          },
          {
            new: true,
            session
          }
        );

        if (!updatedRawProduct) {
          const currentProduct = await Product.findOne({ _id: rm.productId, user: req.user._id }).session(session);
          const currentStock = currentProduct ? currentProduct.stock : 0;
          throw new Error(
            `Insufficient stock for ${product.name}. Available: ${currentStock}, Required: ${rm.quantity}`
          );
        }
      }

      for (const pp of producedProductsWithNames) {
        await Product.findOneAndUpdate(
          { _id: pp.productId, user: req.user._id },
          {
            $inc: { stock: pp.quantity },
            lastRestocked: new Date()
          },
          { session }
        );
      }

      const production = await Production.create([{
        user: req.user._id,
        date: date ? new Date(date) : new Date(),
        rawMaterials: rawMaterialsWithNames,
        producedProducts: producedProductsWithNames,
        ratios,
        notes,
        status: 'completed'
      }], { session });

      await session.commitTransaction();

      for (const rm of rawMaterialsWithNames) {
        const updatedProduct = await Product.findOne({ _id: rm.productId, user: req.user._id });
        await checkAndAlertLowStock(updatedProduct);
      }

      for (const pp of producedProductsWithNames) {
        const updatedProduct = await Product.findOne({ _id: pp.productId, user: req.user._id });
        await checkAndAlertLowStock(updatedProduct);
      }

      const populatedProduction = await Production.findOne({ _id: production[0]._id, user: req.user._id })
        .populate('rawMaterials.productId')
        .populate('producedProducts.productId');

      res.status(201).json(populatedProduction);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { user: req.user._id };

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

