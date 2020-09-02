import React, { useState, useEffect } from "react";
import { useApolloClient, useQuery, useSubscription } from "@apollo/client";
import Authors from "./components/Authors";
import Books from "./components/Books";
import NewBook from "./components/NewBook";
import LoginForm from "./components/LoginForm";
import Recommend from "./components/Recommend";
import { CURRENT_USER, BOOK_ADDED } from "./queries";

const App = () => {
  const [page, setPage] = useState("authors");
  const [token, setToken] = useState(null);
  const result = useQuery(CURRENT_USER);
  const client = useApolloClient();

  useSubscription(BOOK_ADDED, {
    onSubscriptionData: ({ subscriptionData }) => {
      window.alert("new book added");
      console.log(subscriptionData);
    },
  });

  useEffect(() => {
    if (!result.loading) {
      result.data
        ? setToken(localStorage.getItem("user-token"))
        : setToken(null);
    }
  }, [result.loading, result.data]);

  return (
    <div>
      <div>
        <button onClick={() => setPage("authors")}>authors</button>
        <button onClick={() => setPage("books")}>books</button>
        {token ? (
          <>
            <button onClick={() => setPage("add")}>add book</button>{" "}
            <button
              onClick={() => {
                setToken(null);
                localStorage.clear();
                setPage("authors");
                client.clearStore();
              }}
            >
              <em>logout</em>
            </button>
            <button onClick={() => setPage("recommend")}>
              <em>recommend</em>
            </button>
          </>
        ) : (
          <button onClick={() => setPage("login")}>login</button>
        )}
      </div>

      <Authors show={page === "authors"} />

      <Books show={page === "books"} />

      <NewBook show={page === "add"} />

      <LoginForm
        show={page === "login"}
        setToken={setToken}
        setPage={setPage}
      />
      {result.data ? (
        <Recommend show={page === "recommend"} user={result.data.me} />
      ) : null}
    </div>
  );
};

export default App;
