import React, { useState, useEffect } from "react";
import { useQuery } from "@apollo/client";
import { ALL_BOOKS } from "../queries";

const Recommend = ({ show, user }) => {
  const result = useQuery(ALL_BOOKS);
  const [recommend, setRecommend] = useState([]);

  useEffect(() => {
    if (!result.loading) {
      const filtered = result.data.allBooks.filter((book) =>
        book.genres.includes(user.favoriteGenre)
      );
      setRecommend(filtered);
    }
  }, [result, user.favoriteGenre]);

  if (!show) return null;
  if (recommend.length === 0) return <h1>no recommendations</h1>;
  return (
    <div>
      <h1>recommendations</h1>
      <p>
        books in your favourite genre{" "}
        <strong>
          <em>patterns</em>
        </strong>
      </p>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
        </thead>
        <tbody>
          {recommend.map((book) => (
            <tr key={book.id}>
              <td>{book.title}</td>
              <td>{book.author.name}</td>
              <td>{book.published}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Recommend;
