import mongoose from 'mongoose';

const integrationSchema = mongoose.Schema({
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    platform: {
        type: String,
        enum: ['facebook', 'instagram', 'whatsapp', 'shopify', 'telegram'],
        required: true
    },
    credentials: {
        accessToken: String,
        refreshToken: String,
        pageId: String,
        adAccountId: String,
        userAccessToken: String, // For Meta
        phoneNumberId: String, // For WhatsApp
        shopUrl: String, // For Shopify
        botToken: String, // For Telegram
        webhookSecret: String,
        expiresAt: Date
    },
    isActive: {
        type: Boolean,
        default: true
    },
    settings: {
        autoReply: {
            type: Boolean,
            default: true
        },
        syncProducts: {
            type: Boolean,
            default: false
        },
        commands: [{
            command: String,
            description: String,
            category: String
        }]
    }
}, {
    timestamps: true
});

// Ensure one integration per platform per company
integrationSchema.index({ company: 1, platform: 1 }, { unique: true });

const Integration = mongoose.model('Integration', integrationSchema);

export default Integration;
