import { FirestoreModel } from "../config/firestoreModel.js";

class ProductModel extends FirestoreModel {
  async create(data) {
    const defaultData = {
      name: "",
      description: "",
      price: 0,
      currency: "USD",
      images: [],
      category: "",
      sku: "",
      inventory: 0,
      isActive: true,
      metadata: {},
      platforms: [], // ['shopify', 'telegram', 'whatsapp', 'website', 'widget']
      ...data
    };
    return super.create(defaultData);
  }
}

const Product = new ProductModel("products");
export default Product;
