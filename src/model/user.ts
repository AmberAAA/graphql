import { MongoDataSource } from 'apollo-datasource-mongodb'
import { ObjectId } from 'bson'

export type User = {
    id: ObjectId
    name: String,
    age: Number
}

export class UserSource extends MongoDataSource<User> {
    getUser(id: string) {
        return this.findOneById(id)
    }
}