import React, { useState } from "react";
import { useApolloClient } from "@apollo/client";
import Authors from "./components/Authors";
import Books from "./components/Books";
import NewBook from "./components/NewBook";
import LoginForm from "./components/LoginForm";

const App = () => {
  const [page, setPage] = useState("authors");
  const [token, setToken] = useState(null);
  const client = useApolloClient();

  if (token) {
    return (
      <div>
        <div>
          <button onClick={() => setPage("authors")}>authors</button>
          <button onClick={() => setPage("books")}>books</button>
          <button onClick={() => setPage("add")}>add book</button>
          <button
            onClick={() => {
              setToken(null);
              localStorage.clear();
              client.resetStore();
            }}
          >
            <em>logout</em>
          </button>
        </div>

        <Authors show={page === "authors"} />

        <Books show={page === "books"} />

        <NewBook show={page === "add"} />
      </div>
    );
  }
  return (
    <div>
      <div>
        <button onClick={() => setPage("authors")}>authors</button>
        <button onClick={() => setPage("books")}>books</button>
        <button onClick={() => setPage("login")}>login</button>
      </div>

      <Authors show={page === "authors"} />

      <Books show={page === "books"} />

      <LoginForm show={page === "login"} setToken={setToken} />
    </div>
  );
};

export default App;
