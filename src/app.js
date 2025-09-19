import express from 'express'; 
import scrapeRoutes from './routes/scrape.routes.js';

const app=express();
app.use(express.json())

app.use('/scrape',scrapeRoutes)

export default app