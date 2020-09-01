const {
  ApolloServer,
  gql,
  UserInputError,
  AuthenticationError,
  PubSub,
} = require("apollo-server");
const jwt = require("jsonwebtoken");
const JWT_SECRET = "sekret";
const mongoose = require("mongoose");
const Author = require("./models/author");
const Book = require("./models/book");
const User = require("./models/user");
const pubsub = new PubSub();

const MONGODB_URI = "mongodb://localhost:27017";
mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(console.log("connected to MongoDB"))
  .catch((error) => {
    console.log("error connection to MongoDB:", error.message);
  });

const typeDefs = gql`
  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }
  type Token {
    value: String!
  }
  type Author {
    id: ID!
    name: String!
    born: Int
    bookCount: Int!
  }
  type Book {
    id: ID!
    title: String!
    published: Int!
    author: Author!
    genres: [String!]!
  }
  type Query {
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genre: String): [Book!]!
    allAuthors: [Author!]!
    me: User!
  }
  type Mutation {
    addBook(
      title: String!
      published: Int!
      author: String!
      genres: [String!]!
    ): Book
    editAuthor(name: String!, setBornTo: Int!): Author
    addAuthor(name: String!, born: Int): Author
    createUser(username: String!, favoriteGenre: String!): User
    login(username: String!, password: String!): Token
  }
  type Subscription {
    bookAdded: Book!
  }
`;

const resolvers = {
  Query: {
    bookCount: () => Book.collection.countDocuments(), //done
    authorCount: () => Author.collection.countDocuments(), //done
    allBooks: async (root, args) => {
      const findAuthor = (list) => {
        return list.map(async ({ id, title, published, genres, author }) => {
          const authorObject = await Author.findById(author);
          return { id, title, published, genres, author: authorObject };
        });
      };
      if (args.author && args.genre) {
        const books = await Book.find({
          author: args.author,
          genres: { $in: [args.genre] },
        });
        return findAuthor(books);
      } else if (args.author) {
        const books = Book.find({ author: args.author });
        return findAuthor(books);
      } else if (args.genre) {
        const books = Book.find({ genres: { $in: [args.genre] } });
        return findAuthor(books);
      }
      const books = await Book.find({});
      return findAuthor(books);
    },
    allAuthors: () => Author.find({}),
    me: (root, args, context) => {
      return context.currentUser;
    },
  },
  Mutation: {
    addBook: async (root, args, context) => {
      if (!context.currentUser)
        throw new AuthenticationError("Invalid credentials");
      try {
        let author = await Author.findOne({ name: args.name });
        if (!author) {
          author = new Author({ name: args.author });
          await author.save();
        }
        const book = new Book({ ...args, author });
        const savedBook = await book.save();

        pubsub.publish("BOOK_ADDED", { bookAdded: savedBook });

        return savedBook;
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        });
      }
    },
    editAuthor: async (root, args, context) => {
      if (!context.currentUser)
        throw new AuthenticationError("Invalid credentials");
      try {
        const author = await Author.findOne({ name: args.name });
        if (!author) {
          return null;
        }
        author.born = args.setBornTo;
        await author.save();
        return author;
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        });
      }
    },
    addAuthor: (root, args) => {
      try {
        const newAuthor = new Author({
          ...args,
        });
        return newAuthor.save();
      } catch (error) {
        throw new UserInputError(error.message);
      }
    },
    createUser: async (root, args) => {
      try {
        const user = new User({
          ...args,
        });
        return user.save();
      } catch (error) {
        throw new UserInputError(error.message);
      }
    },
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username });

      if (!user || args.password !== "password") {
        throw new UserInputError("Wrong credentials");
      }

      const userForToken = {
        username: user.username,
        id: user._id,
      };
      return {
        value: jwt.sign(userForToken, JWT_SECRET, {
          expiresIn: "24h",
        }),
      };
    },
  },
  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterator(["BOOK_ADDED"]),
    },
  },
  Author: {
    bookCount: async (root, args) => {
      const author = await Author.findOne({ name: root.name }).select("_id");
      return Book.find({ author }).countDocuments();
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const auth = req ? req.headers.authorization : null;
    if (auth && auth.toLowerCase().startsWith("bearer ")) {
      const decodedToken = jwt.verify(auth.substring(7), JWT_SECRET);
      const currentUser = await User.findById(decodedToken.id).populate(
        "friends"
      );
      return { currentUser };
    }
  },
});

server.listen().then(({ url, subscriptionsUrl }) => {
  console.log(`Server ready at ${url}`);
  console.log(`Subscription url ready at ${subscriptionsUrl}`);
});
