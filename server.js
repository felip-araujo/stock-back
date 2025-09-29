import express from 'express';
import cors from 'cors';
import companiesRoutes from './src/routes/companiesRoutes.js'

const app = express();
app.use(cors());
app.use(express.json());

app.use('/companies', companiesRoutes);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
