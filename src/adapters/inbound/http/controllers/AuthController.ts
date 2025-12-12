import { Request, Response, NextFunction } from 'express';
import { Service, Inject } from 'typedi';
import { AuthService } from '../../../../domain/auth/AuthService';

@Service()
export class AuthController {
    constructor(
        @Inject() private authService: AuthService
    ) { }

    async signup(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password, organizationId } = req.body;
            const user = await this.authService.signup(email, password, organizationId);
            res.status(201).json(user);
        } catch (error) {
            next(error);
        }
    }

    async signin(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password } = req.body;
            const result = await this.authService.signin(email, password);
            res.status(200).json(result);
        } catch (error) {
            next(error); // Might want to map error to specific status code
        }
    }

    async me(req: Request, res: Response, next: NextFunction) {
        try {
            // User is attached by middleware
            const user = (req as any).user;
            if (!user) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }
            res.status(200).json(user);
        } catch (error) {
            next(error);
        }
    }
}
