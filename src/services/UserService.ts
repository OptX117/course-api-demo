import { User, UserService } from '../types';
import UserModel from '../models/User';

interface InternalUser extends User {
    _id: string;
    passwordHash: string;

    isPasswordValid(password: string): boolean;

    setPassword(password: string): void;
}

export default class UserServiceImpl implements UserService {
    async addUser(username: string, password: string, lecturer: boolean): Promise<User> {
        const newUser = new UserModel() as unknown as InternalUser;

        newUser.name = username;
        newUser.isLecturer = lecturer;
        newUser.setPassword(password);

        await (newUser as any).save();
        return await this.getUser(username) as any;
    }

    async getAllUsers(): Promise<User[]> {
        return UserModel.find().exec().then(result => result.map(el => {
            const internalUser = el as unknown as InternalUser;
            return {
                name: internalUser.name,
                isLecturer: internalUser.isLecturer,
                id: internalUser._id.toString()
            };
        }));
    }

    async getUser(username: string): Promise<User | null> {
        const internalUser = await this.getInternalUser(username);
        if (internalUser != null) {
            {
                return {
                    name: internalUser.name,
                    isLecturer: internalUser.isLecturer,
                    id: internalUser._id.toString()
                };
            }
        } else {
            return null;
        }
    }

    async isPasswordValid(userOrUsername: User | string, password: string): Promise<boolean> {
        const user = await (typeof userOrUsername ===
                            'string' ? this.getInternalUser(userOrUsername) : this.getInternalUser(
            userOrUsername.id));
        return user != null && user.passwordHash != null && user.isPasswordValid(password);
    }

    private getInternalUser(username: string): Promise<InternalUser | null> {
        return UserModel.findOne({name: username}).exec()
            .then(value => {
                if (value != null) {
                    return value as unknown as InternalUser;
                }
                return null;
            });
    }

}
