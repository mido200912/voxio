import 'dotenv/config';
import mongoose from 'mongoose';

// Define a simple schema to retrieve Company data
const CompanySchema = new mongoose.Schema({
  name: String,
  requests: mongoose.Schema.Types.Mixed
});
const Company = mongoose.models.Company || mongoose.model('Company', CompanySchema);

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");

  const companies = await Company.find({});
  for (const comp of companies) {
    if (comp.requests && comp.requests.length > 0) {
      console.log(`Company: ${comp.name}`);
      const midoReqs = comp.requests.filter(r => (r.customerName || '').includes('Mido'));
      console.log("Mido Requests:", JSON.stringify(midoReqs, null, 2));
    }
  }

  process.exit(0);
}

run().catch(console.error);
