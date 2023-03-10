import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/errorHandler.js";
import getDataUri from "../utils/dataUri.js";
import cloudinary from "cloudinary";
import Product from "../models/productModel.js";
import Category from "../models/categoryModel.js";


export const getAllProducts = catchAsyncErrors(async (req, res, next) => {
    const keyword = req.query.keyword || "";

  
    const products = await Product.find({
        name:{
          $regex:keyword,
          $options:"i"
      }
    });
  
    res.status(200).json({
      success: true,
      products,
    });
  });

  export const getAllProductByCategory = catchAsyncErrors(async (req, res, next) => {
   
    const category = req.query.category || undefined;
  
    const products = await Product.find({
      category
    });
  
    res.status(200).json({
      success: true,
      products,
    });
  });

  export const getAdminProducts = catchAsyncErrors(async (req, res, next) => {
    const products = await Product.find({}).populate("category");
  
    const outOfStock = products.filter((i) => i.stock === 0);
  
    res.status(200).json({
      success: true,
      products,
      outOfStock: outOfStock.length,
      inStock: products.length - outOfStock.length,
    });
  });
  
  export const getProductDetails = catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.params.id).populate("category");
  
    if (!product) return next(new ErrorHandler("Product not found", 404));
  
    res.status(200).json({
      success: true,
      product,
    });
  });
  
  export const createProduct = catchAsyncErrors(async (req, res, next) => {
    const { name, description, category, price, stock } = req.body;
  
    if (!req.file) return next(new ErrorHandler("Please add image", 400));


    if(!name || !description || !price || !stock){
      return next(new ErrorHandler("please enter all fields ",400));
   }
  
    const file = getDataUri(req.file);
    const myCloud = await cloudinary.v2.uploader.upload(file.content);
    const image = {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    };
  
    await Product.create({
      name,
      description,
      category,
      price,
      stock,
      images: [image],
    });
  
    res.status(200).json({
      success: true,
      message: "Product Created Successfully",
    });
  });
  
  export const updateProduct = catchAsyncErrors(async (req, res, next) => {
    const { name, description, category, price, stock } = req.body;
  
    const product = await Product.findById(req.params.id);
    if (!product) return next(new ErrorHandler("Product not found", 404));
  
    if (name) product.name = name;
    if (description) product.description = description;
    if (category) product.category = category;
    if (price) product.price = price;
    if (stock) product.stock = stock;
  
    await product.save();
  
    res.status(200).json({
      success: true,
      message: "Product Updated Successfully",
    });
  });
  
  export const addProductImage = catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    if (!product) return next(new ErrorHandler("Product not found", 404));
  
    if (!req.file) return next(new ErrorHandler("Please add image", 400));
  
    const file = getDataUri(req.file);
    const myCloud = await cloudinary.v2.uploader.upload(file.content);
    const image = {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    };
  
    product.images.push(image);
    await product.save();
  
    res.status(200).json({
      success: true,
      message: "Image Added Successfully",
    });
  });
  
  export const deleteProductImage = catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    if (!product) return next(new ErrorHandler("Product not found", 404));
  
    const id = req.query.id;
  
    if (!id) return next(new ErrorHandler("Please Image Id", 400));
  
    let isExist = -1;
  
    product.images.forEach((item, index) => {
      if (item._id.toString() === id.toString()) isExist = index;
    });
  
    if (isExist < 0) return next(new ErrorHandler("Image doesn't exist", 400));
  
    await cloudinary.v2.uploader.destroy(product.images[isExist].public_id);
  
    product.images.splice(isExist, 1);
  
    await product.save();
  
    res.status(200).json({
      success: true,
      message: "Image Deleted Successfully",
    });
  });
  
  export const deleteProduct = catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    if (!product) return next(new ErrorHandler("Product not found", 404));
  
    for (let index = 0; index < product.images.length; index++) {
      await cloudinary.v2.uploader.destroy(product.images[index].public_id);
    }
    await product.remove();
    res.status(200).json({
      success: true,
      message: "Product Deleted Successfully",
    });
  });
  
  export const addCategory = catchAsyncErrors(async (req, res, next) => {
    await Category.create(req.body);
  
    res.status(201).json({
      success: true,
      message: "Category Added Successfully",
    });
  });
  
  export const getAllCategories = catchAsyncErrors(async (req, res, next) => {
    const categories = await Category.find({});
  
    res.status(200).json({
      success: true,
      categories,
    });
  });
  
  export const deleteCategory = catchAsyncErrors(async (req, res, next) => {
    const category = await Category.findById(req.params.id);
    if (!category) return next(new ErrorHandler("Category Not Found", 404));
    const products = await Product.find({ category: category._id });
  
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      product.category = undefined;
      await product.save();
    }
  
    await category.remove();
  
    res.status(200).json({
      success: true,
      message: "Category Deleted Successfully",
    });
  });