import Koa from 'koa'
import { ApolloServer,  gql } from 'apollo-server-koa'
import cors from '@koa/cors'
import { MongoClient, ObjectId  } from 'mongodb'
import { User, UserSource } from './model/user'

export type Book = {
    title: String,
    author: String
}

const books :Book[] = [
    {
        title: "Amber Book",
        author: "Amber"
    }, {
        title: "City of Glass",
        author: "Paul Auster"
    }
]

async function startServer() {
    const client = new MongoClient("mongodb://admin:admin@anborong.top:27017/admin")
    await client.connect()

    const typeDefs  = gql`
        type Book {
            title: String,
            author: String
        }
        type User {
            _id: String,
            name: String,
            age: String
        }
        type Query {
            hello: String
            books: [Book]
            getUser: User
        }
        type Mutation {
            addUser(name: String, age: Int): User
        }
    `;

    const resolvers = {
        Query: {
            hello: () => 'Hello World!',
            books: () => books,
            //@ts-ignore
            async getUser (parent, args, context, info) {
                console.dir(parent)
                console.dir(args)
                console.dir(context)
                console.dir(info)
                return client.db("demo").collection("users").findOne({_id: new ObjectId("6114da69828d2a7ad6954222")})
            }
        },
        Mutation: {
            //@ts-ignore
            async addUser (parent, args, context, info) {
                const { name, age } = args
                const col = client.db("demo").collection("users")
                const data = await col.insertOne({ name, age })
                return col.findOne({_id: data.insertedId})
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