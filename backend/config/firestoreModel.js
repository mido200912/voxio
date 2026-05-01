import mongoose from 'mongoose';
import { cacheGet, cacheSet, cacheDelete } from '../utils/cache.js';

// Connect to MongoDB using the URI from .env
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/voxio';
if (mongoose.connection.readyState === 0) {
    mongoose.connect(mongoUri).then(() => console.log('🍃 Connected to MongoDB')).catch(err => console.error('❌ MongoDB Connection Error:', err));
}

// Define a dynamic schema that accepts anything (NoSQL style)
const dynamicSchema = new mongoose.Schema({}, { strict: false, timestamps: true });

export class FirestoreModel {
    constructor(collectionName) {
        this.collectionName = collectionName;
        // Map collection name to a Mongoose model
        this.Model = mongoose.models[collectionName] || mongoose.model(collectionName, dynamicSchema);
    }

    async findById(id) {
        if (!id) return null;
        const cacheKey = `${this.collectionName}:id:${id}`;
        const cached = cacheGet(cacheKey);
        if (cached) return cached;

        const doc = await this.Model.findById(id);
        if (!doc) return null;
        
        const instance = this._createDocumentInstance(doc);
        cacheSet(cacheKey, instance, 2 * 60 * 1000);
        return instance;
    }

    async findOne(query) {
        // Translate _id if present
        const mongoQuery = { ...query };
        if (mongoQuery._id) {
            mongoQuery._id = mongoQuery._id;
        }

        const doc = await this.Model.findOne(mongoQuery);
        if (!doc) return null;

        return this._createDocumentInstance(doc);
    }

    async find(query = {}) {
        const docs = await this.Model.find(query);
        return docs.map(doc => this._createDocumentInstance(doc));
    }

    async create(data) {
        const doc = await this.Model.create(data);
        const instance = this._createDocumentInstance(doc);
        cacheSet(`${this.collectionName}:id:${doc._id}`, instance, 2 * 60 * 1000);
        return instance;
    }

    async findByIdAndDelete(id) {
        if (!id) return false;
        await this.Model.findByIdAndDelete(id);
        cacheDelete(`${this.collectionName}:id:${id}`);
        return true;
    }

    // Mimic the Firestore instance behavior with a .save() method
    _createDocumentInstance(mongoDoc) {
        const docObj = mongoDoc.toObject();
        const instance = { ...docObj, _id: docObj._id.toString(), id: docObj._id.toString() };
        const Model = this.Model;

        Object.defineProperty(instance, 'save', {
            value: async function () {
                const dataToSave = { ...this };
                const id = dataToSave._id;
                delete dataToSave._id;
                delete dataToSave.id;
                delete dataToSave.save;

                await Model.findByIdAndUpdate(id, dataToSave, { upsert: true });
                cacheDelete(`${Model.modelName}:id:${id}`);
                return this;
            }.bind(instance),
            enumerable: false
        });

        return instance;
    }
}
