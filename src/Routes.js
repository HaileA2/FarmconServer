//main router setup goes here
import { Router } from "express";
const router=Router();
import authRoutes from './modules/auth/auth.route.js';

router.use('/auth',authRoutes);

export default router;