import Koa from 'koa'
import { ApolloServer,  gql } from 'apollo-server-koa'
import cors from '@koa/cors'
import { MongoClient, ObjectId  } from 'mongodb'
import { User, UserSource } from './model/user'

export type Book = {
    title: String,
    author: String
}

async function startServer() {
    const client = new MongoClient("mongodb://admin:admin@anborong.top:27017/admin")
    await client.connect()

    const typeDefs  = gql`
        type User {
            _id: String,
            name: String
            age: Int
        }
        type Query {
            getUser(_id: String): User
            getAllUser: [User]
        }
        input UserInput {
            _id: String!
            name: String
            age: Int
        }
        type Mutation {
            addUser(name: String, age: Int): User
            deleteUser(_id: String): Boolean
            updateUser(user: UserInput): Boolean
        }
    `;

    const resolvers = {
        Query: {
            async getUser (_: any, args: any) {
                return client.db("demo").collection("users").findOne({_id: new ObjectId(args._id)})
            },
            async getAllUser () {
                return client.db("demo").collection("users").find().toArray()
            }

        },
        Mutation: {
            async addUser (_: any, args: any) {
                const { name, age } = args
                const col = client.db("demo").collection("users")
                const data = await col.insertOne({ name, age })
                return col.findOne({_id: data.insertedId})
            },
            async deleteUser(_: any, { _id }: any) {
                const res = await client.db("demo").collection("users").deleteOne({_id: new ObjectId(_id)})
                return res.acknowledged && res.deletedCount === 1
            },
            async updateUser(_: any, { user: {_id, ...user} }: any) {
                const res = await client.db("demo").collection("users").findOneAndUpdate({ _id: new ObjectId(_id) }, { $set: user })
                console.dir(res)
                return res.ok
            }
        }
    };




    const server = new ApolloServer({ typeDefs, resolvers})
    await server.start()
    const app = new Koa()
    app.use(cors())
    server.applyMiddleware({ app, path: '/gql' })
    await new Promise<void>(res => app.listen({port: 4000}, res))
    console.log("start")
}

startServer()


// docker run --name mongo -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=admin -d mongo
// docker run -d -p 8081:8081 --link mongo:mongo  -e ME_CONFIG_MONGODB_URL:mongodb://admin:Superadmin123@mongo:27017/ --name mongo-client mongo-express