import { AuthService, ConfigurationService, User, UserService } from '../types';
import { NextFunction, Request, Response } from 'express';
import logger from '../winston';
import jwt from 'jsonwebtoken';

export default class AuthServiceImpl implements AuthService {
    private readonly userService: UserService;
    private readonly configService: ConfigurationService;
    private secretKey?: string;

    constructor(userService: UserService, configService: ConfigurationService) {
        this.userService = userService;
        this.configService = configService;
    }

    public authorize(hasToBeLecturer = false, name?: string): (req: Request, res: Response,
                                                               next: NextFunction) => Promise<void> {
        return async (req, res, next) => {
            const jwtCookie = req.cookies['jsession'];
            const jwtHeader = req.header('Authorization');

            if (!jwtCookie && !jwtHeader?.includes('Bearer')) {
                res.sendStatus(403);
            } else {
                const jwt = jwtCookie || (jwtHeader || '').replace(/^bearer\s/gim, '');
                await this.verifyWebToken(jwt, hasToBeLecturer, name).then((res) => {
                    try {
                        req.params.username = res.name;
                        next();
                    } catch (err) {
                        next(err);
                    }
                }, err => next(err));
            }
        };
    }

    public checkUsername(): (req: Request, res: Response,
                             next: NextFunction) => Promise<void> {
        return async (req, res, next) => {
            const jwtCookie = req.cookies['jsession'];
            const jwtHeader = req.header('Authorization');

            if (!jwtCookie && !jwtHeader?.includes('Bearer')) {
                next();
            } else {
                const jwt = jwtCookie || (jwtHeader || '').replace(/^bearer\s/gim, '');
                await this.verifyWebToken(jwt).then((res) => {
                    try {
                        req.params.username = res.name;
                        next();
                    } catch (err) {
                        next(err);
                    }
                }, err => next(err));
            }
        };
    }

    public async logIn(username: string, password: string): Promise<User & { token: string } | undefined> {
        if (!await this.userService.isPasswordValid(username, password)) {
            return;
        }

        const user = await this.userService.getUser(username) as User;
        const token = await this.generateWebToken(user);
        return Object.assign({token}, user);
    }

    /**
     * Verifies a given token string, optionally with constraints
     * @param {string} token The token to check
     * @param {boolean} hasToBeLecturer Whether or not the user has to be a lecturer
     * @param {string} name Which name has to be encoded in the token
     * @returns {Promise<boolean>}
     * @private
     */
    private async verifyWebToken(token: string, hasToBeLecturer = false, name?: string): Promise<User> {
        if (!this.secretKey) {
            this.secretKey = (await this.configService.getConfiguration()).jwt;
        }

        try {
            const decoded = jwt.verify(token, this.secretKey, {issuer: 'CourseDemoApp'}) as Record<string, unknown>;

            if (typeof decoded === 'object' && (!hasToBeLecturer || decoded.lecturer) &&
                (name == null || name === decoded.name)) {
                return {
                    id: decoded.sub as string,
                    isLecturer: decoded.lecturer as boolean,
                    name: decoded.name as string
                };
            }
        } catch (err) {
            logger.error('Error decoding JWT token!', {err});
        }

        throw new Error('Token does not match required parameters!');
    }

    /**
     * Generate a web token for the given user. Will embedd user level (lecturer or not) and name.
     * @param {User} user
     * @returns {Promise<string>}
     * @private
     */
    private async generateWebToken(user: User): Promise<string> {
        if (!this.secretKey) {
            this.secretKey = (await this.configService.getConfiguration()).jwt;
        }

        return jwt.sign({
            name: user.name,
            lecturer: user.isLecturer
        }, this.secretKey, {expiresIn: '1h', subject: user.id, issuer: 'CourseDemoApp'});
    }

}
