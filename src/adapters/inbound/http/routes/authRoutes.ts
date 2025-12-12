import { Router } from 'express';
import { Container } from 'typedi';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router: Router = Router();

// We need to bind the context because we are passing the method as a handler
// Use lazy resolution to ensure all dependencies are registered before instantiation
router.post('/signup', (req, res, next) => Container.get(AuthController).signup(req, res, next));
router.post('/signin', (req, res, next) => Container.get(AuthController).signin(req, res, next));
router.get('/me', authMiddleware.authenticate(), (req, res, next) => Container.get(AuthController).me(req, res, next));

export { router as authRouter };
